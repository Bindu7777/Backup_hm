import { supabase } from '../lib/supabase';
import { supabaseImageService } from './supabaseImageService';
import { imageProcessingService } from './imageProcessingService';

// Timeout wrapper to prevent long-hanging network calls from stalling submission
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 15000, fallbackValue?: T): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`Operation timed out after ${timeoutMs / 1000}s`));
      }
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

export interface VendorOnboardingFormData {
  // 1. Vendor and contact details
  brand_name: string;
  brand_logo_file?: File | null;
  brand_logo_preview?: string;
  spoc_name: string;
  phone_number: string;
  is_whatsapp_same_as_phone: boolean;
  whatsapp_number?: string;
  email?: string;
  website_or_instagram?: string;

  // 2. Location and services
  address?: string;
  city: string;
  state: string;
  areas_served: string;
  categories: string[];
  other_category?: string;
  description_of_services: string;

  // 3. Experience, pricing, and portfolio
  years_of_experience: string;
  share_price_after_discussion: boolean;
  starting_price?: number | string;
  pricing_unit?: string;
  portfolio_files?: File[];
  portfolio_previews?: string[];
  portfolio_or_social_links?: string;
  events_served_specialties?: string[];

  // 4. Follow-up and review
  preferred_contact_method?: 'Phone' | 'WhatsApp' | 'Email' | 'Any';
  best_time_to_contact?: string;
  confirm_accurate: boolean;
  permission_contact: boolean;
  application_status: 'Pending review';
}

export interface VendorApplicationResult {
  success: boolean;
  applicationId: string;
  vendorId?: string | number;
  message?: string;
  error?: string;
}

// Indian states and UTs list
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export const SERVICE_CATEGORIES = [
  'Event management',
  'Photography and videography',
  'Decorations',
  'Makeup and hair',
  'Catering',
  'Venue',
  'Entertainment',
  'Other'
];

export const EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1 - 2 years',
  '3 - 5 years',
  '5 - 10 years',
  '10+ years'
];

export const COMMON_SPECIALTIES = [
  'Weddings',
  'Receptions',
  'Engagements',
  'Birthdays',
  'Haldi & Sangeet',
  'Corporate Events',
  'Baby Showers',
  'Pre-wedding Shoots',
  'Housewarming',
  'Anniversaries'
];

export const CONTACT_TIME_OPTIONS = [
  'Morning (9 AM - 12 PM)',
  'Afternoon (12 PM - 4 PM)',
  'Evening (4 PM - 8 PM)',
  'Anytime during business hours'
];

// Helper to generate a slug
const generateSlug = (brandName: string): string => {
  const base = brandName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${base || 'vendor'}-${Date.now().toString(36).slice(-4)}`;
};

// Helper to convert file to data URL as safe fallback
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Submit vendor onboarding form to Supabase
 */
export const submitVendorOnboarding = async (
  formData: VendorOnboardingFormData
): Promise<VendorApplicationResult> => {
  const generatedAppId = `HM-VND-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    console.log('Submitting vendor onboarding application:', formData.brand_name);

    // Format phone and WhatsApp numbers
    const cleanPhone = formData.phone_number.trim().replace(/[^0-9]/g, '');
    const cleanWhatsApp = formData.is_whatsapp_same_as_phone
      ? cleanPhone
      : (formData.whatsapp_number || '').trim().replace(/[^0-9]/g, '') || cleanPhone;

    // Determine starting price
    // NOTE: PostgreSQL vendors table has check constraint check_starting_price_positive (starting_price > 0).
    // Therefore starting_price MUST be >= 1 in the database column to avoid check constraint violations.
    let parsedPrice = 1;
    if (!formData.share_price_after_discussion && formData.starting_price) {
      const num = typeof formData.starting_price === 'number'
        ? formData.starting_price
        : parseFloat(formData.starting_price.toString().replace(/[^0-9.]/g, ''));
      parsedPrice = (!isNaN(num) && num > 0) ? Math.round(num) : 1;
    } else {
      // Default to 1 when sharing after discussion or when empty
      parsedPrice = 1;
    }

    // Categories array
    const selectedCategories = [...formData.categories];
    if (selectedCategories.includes('Other') && formData.other_category?.trim()) {
      selectedCategories.push(formData.other_category.trim());
    }

    // Primary category (first selected)
    const primaryCategory = selectedCategories[0] || 'Event management';

    // Handle Brand Logo Upload (with client-side optimization & timeout protection)
    let brandLogoUrl = '';
    if (formData.brand_logo_file) {
      try {
        let fileToUpload = formData.brand_logo_file;
        try {
          const comp = await imageProcessingService.processImage(fileToUpload, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.85,
            format: 'jpeg'
          });
          if (comp.success && comp.processedFile) {
            fileToUpload = comp.processedFile;
          }
        } catch (compErr) {
          console.warn('Brand logo pre-compression skipped:', compErr);
        }

        const uploadResult = await withTimeout(
          supabaseImageService.uploadImage(
            fileToUpload,
            `onboarding_${cleanPhone}`,
            'brand_logo',
            `${formData.brand_name} Logo`
          ),
          15000 // 15s max
        );
        if (uploadResult?.success && uploadResult?.publicUrl) {
          brandLogoUrl = uploadResult.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Brand logo storage upload failed or timed out:', uploadErr);
      }
    } else if (formData.brand_logo_preview && formData.brand_logo_preview.startsWith('http')) {
      // Only keep existing valid remote HTTP URLs, never massive base64 strings
      brandLogoUrl = formData.brand_logo_preview;
    }

    // Handle Portfolio Uploads (Concurrent uploads with client-side compression & timeout)
    const portfolioUrls: string[] = [];

    // Keep existing remote URLs if any
    if (formData.portfolio_previews && Array.isArray(formData.portfolio_previews)) {
      for (const p of formData.portfolio_previews) {
        if (typeof p === 'string' && p.startsWith('http')) {
          portfolioUrls.push(p);
        }
      }
    }

    // Upload portfolio files concurrently
    if (formData.portfolio_files && formData.portfolio_files.length > 0) {
      const uploadTasks = formData.portfolio_files.map(async (file, idx) => {
        try {
          let fileToUpload = file;
          try {
            const comp = await imageProcessingService.processImage(file, {
              maxWidth: 1280,
              maxHeight: 1280,
              quality: 0.8,
              format: 'jpeg'
            });
            if (comp.success && comp.processedFile) {
              fileToUpload = comp.processedFile;
            }
          } catch (compErr) {
            console.warn(`Portfolio image ${idx + 1} pre-compression skipped:`, compErr);
          }

          const res = await withTimeout(
            supabaseImageService.uploadImage(
              fileToUpload,
              `onboarding_${cleanPhone}`,
              'portfolio',
              `${formData.brand_name} Portfolio ${idx + 1}`
            ),
            15000 // 15s timeout per image
          );

          if (res?.success && res?.publicUrl) {
            return res.publicUrl;
          }
        } catch (pErr) {
          console.warn(`Portfolio image ${idx + 1} upload failed or timed out:`, pErr);
        }
        return null;
      });

      const settled = await Promise.allSettled(uploadTasks);
      for (const item of settled) {
        if (item.status === 'fulfilled' && item.value) {
          portfolioUrls.push(item.value);
        }
      }
    }

    // Format address
    const fullAddressParts = [
      formData.address?.trim(),
      formData.city?.trim(),
      formData.state?.trim()
    ].filter(Boolean);
    const combinedAddress = fullAddressParts.join(', ');

    // Detailed metadata for additional_info
    const additionalInfo = {
      is_sample: false, // Brand new real vendor, never tagged as sample
      application_id: generatedAppId,
      application_status: 'Pending review', // Set automatically to Pending review
      source: 'vendor_onboarding_form',
      submitted_at: new Date().toISOString(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      areas_served: formData.areas_served.trim(),
      service_areas: [formData.city.trim(), formData.state.trim(), formData.areas_served.trim()],
      selected_categories: selectedCategories,
      other_category: formData.other_category || '',
      share_price_after_discussion: Boolean(formData.share_price_after_discussion),
      pricing_type: formData.share_price_after_discussion ? 'Share after discussion' : 'Starting price specified',
      pricing_unit: formData.pricing_unit || 'Per event',
      display_starting_price: formData.share_price_after_discussion ? null : (parsedPrice > 1 ? parsedPrice : null),
      portfolio_links: formData.portfolio_or_social_links || '',
      portfolio_photos: portfolioUrls,
      brand_logo_url: brandLogoUrl,
      events_served_specialties: formData.events_served_specialties || [],
      preferred_contact_method: formData.preferred_contact_method || 'Phone',
      best_time_to_contact: formData.best_time_to_contact || 'Anytime during business hours',
      confirm_accurate: formData.confirm_accurate,
      permission_contact: formData.permission_contact,
      website_or_instagram: formData.website_or_instagram || '',
      review_notes: 'New vendor application submitted via self-serve onboarding page.'
    };

    // Prepare vendor payload matching Supabase 'vendors' schema
    const slug = generateSlug(formData.brand_name);
    const vendorRecord: Record<string, any> = {
      brand_name: formData.brand_name.trim(),
      slug: slug,
      spoc_name: formData.spoc_name.trim(),
      phone_number: cleanPhone,
      whatsapp_number: cleanWhatsApp,
      email: formData.email?.trim() || null,
      instagram: formData.website_or_instagram?.trim() || null,
      address: combinedAddress,
      experience: formData.years_of_experience,
      starting_price: parsedPrice, // Guaranteed >= 1 to satisfy check_starting_price_positive
      category: selectedCategories, // text[] array in DB
      categories: selectedCategories,
      subcategory: primaryCategory,
      quick_intro: formData.description_of_services.slice(0, 180),
      detailed_intro: formData.description_of_services.trim(),
      avatar_url: brandLogoUrl || null,
      brand_logo_url: brandLogoUrl || null,
      verified: false, // Pending review
      currently_available: false, // Activates when reviewed & approved
      rating: 0,
      review_count: 0,
      additional_info: additionalInfo
    };

    // Attempt insert into vendors table with timeout protection
    const { data: insertedVendor, error: insertError } = await withTimeout(
      supabase
        .from('vendors')
        .insert([vendorRecord])
        .select()
        .single(),
      20000
    );

    if (insertError) {
      console.error('Error inserting vendor into database:', insertError);

      // Check for check_starting_price_positive error
      if (insertError.message?.includes('check_starting_price_positive') || insertError.message?.includes('starting_price')) {
        console.warn('Retrying insert with starting_price = 1 fallback...');
        const retryRecord = {
          ...vendorRecord,
          starting_price: 1
        };
        const { data: retryData, error: retryError } = await supabase
          .from('vendors')
          .insert([retryRecord])
          .select()
          .single();

        if (!retryError && retryData) {
          const vendorId = retryData?.vendor_id || retryData?.id;
          await postSubmissionActions(vendorId, formData, generatedAppId, brandLogoUrl);
          return {
            success: true,
            applicationId: generatedAppId,
            vendorId: vendorId,
            message: 'Application submitted successfully! Our team will review your details.'
          };
        }
      }

      // If error might be due to column constraints (e.g. categories vs category), try minimal fallback
      if (insertError.message?.includes('category') || insertError.message?.includes('column')) {
        console.warn('Retrying insert with single string category fallback...');
        const fallbackRecord = {
          ...vendorRecord,
          category: primaryCategory,
          categories: undefined,
          starting_price: Math.max(1, parsedPrice)
        };
        const { data: retryData, error: retryError } = await supabase
          .from('vendors')
          .insert([fallbackRecord])
          .select()
          .single();

        if (retryError) {
          throw new Error(`Database error: ${retryError.message}`);
        }

        const vendorId = retryData?.vendor_id || retryData?.id;
        await postSubmissionActions(vendorId, formData, generatedAppId, brandLogoUrl);
        return {
          success: true,
          applicationId: generatedAppId,
          vendorId: vendorId,
          message: 'Application submitted successfully! Our team will review your details.'
        };
      }

      // Provide friendly error message
      let friendlyError = insertError.message || 'Failed to submit application';
      if (insertError.message?.includes('check_starting_price_positive')) {
        friendlyError = 'Please provide a valid starting price or select "Share after discussion".';
      } else if (insertError.message?.includes('timeout') || insertError.message?.includes('Failed to fetch')) {
        friendlyError = 'Network connection timed out. Please check your internet connection and try again.';
      }

      throw new Error(friendlyError);
    }

    const vendorId = insertedVendor?.vendor_id || insertedVendor?.id;
    await postSubmissionActions(vendorId, formData, generatedAppId, brandLogoUrl);

    return {
      success: true,
      applicationId: generatedAppId,
      vendorId: vendorId,
      message: 'Application submitted successfully! Our team will review your details.'
    };
  } catch (error: any) {
    console.error('Submission failed with exception:', error);
    return {
      success: false,
      applicationId: generatedAppId,
      error: error?.message || 'Something went wrong while submitting your application. Please try again.'
    };
  }
};

/**
 * Handle secondary tasks like media table inserts, notifications, etc.
 */
async function postSubmissionActions(
  vendorId: string | number | undefined,
  formData: VendorOnboardingFormData,
  applicationId: string,
  brandLogoUrl: string
) {
  if (!vendorId) return;

  try {
    // 1. If brand logo exists, save to vendor_media table
    if (brandLogoUrl && brandLogoUrl.startsWith('http')) {
      await supabase
        .from('vendor_media')
        .insert([{
          vendor_id: vendorId.toString(),
          media_url: brandLogoUrl,
          media_type: 'image',
          category: 'brand_logo',
          public: true,
          uploaded_at: new Date().toISOString()
        }]);
    }

    // 2. Notify Admin via admin_notifications if table exists
    try {
      await supabase
        .from('admin_notifications')
        .insert([{
          vendor_id: vendorId,
          notification_type: 'new_vendor_application',
          title: `New Vendor Application: ${formData.brand_name}`,
          message: `Application ${applicationId} submitted by ${formData.spoc_name} (${formData.phone_number}) from ${formData.city}. Status: Pending review.`,
          created_at: new Date().toISOString()
        }]);
    } catch (notifErr) {
      // Non-blocking
      console.log('Admin notification insert skipped/failed:', notifErr);
    }
  } catch (err) {
    console.warn('Post submission helper non-fatal error:', err);
  }
}

