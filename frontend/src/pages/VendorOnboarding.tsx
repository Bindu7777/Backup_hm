import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  Instagram,
  MapPin,
  Sparkles,
  Upload,
  X,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Camera,
  Palette,
  Utensils,
  Music,
  Share2,
  Calendar,
  Layers,
  Info,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  INDIAN_STATES,
  SERVICE_CATEGORIES,
  EXPERIENCE_OPTIONS,
  COMMON_SPECIALTIES,
  CONTACT_TIME_OPTIONS,
  fileToDataUrl,
  submitVendorOnboarding,
  VendorOnboardingFormData
} from '@/services/vendorOnboardingService';
import { imageProcessingService } from '@/services/imageProcessingService';

// Category icons mapping
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Event management':
      return <Calendar className="w-5 h-5 text-orange-600" />;
    case 'Photography and videography':
      return <Camera className="w-5 h-5 text-blue-600" />;
    case 'Decorations':
      return <Palette className="w-5 h-5 text-pink-600" />;
    case 'Makeup and hair':
      return <Sparkles className="w-5 h-5 text-purple-600" />;
    case 'Catering':
      return <Utensils className="w-5 h-5 text-amber-600" />;
    case 'Venue':
      return <Building2 className="w-5 h-5 text-emerald-600" />;
    case 'Entertainment':
      return <Music className="w-5 h-5 text-indigo-600" />;
    case 'Other':
    default:
      return <Layers className="w-5 h-5 text-slate-600" />;
  }
};

const VendorOnboarding: React.FC = () => {
  const navigate = useNavigate();

  // Current wizard step: 1 = Details, 2 = Location & Services, 3 = Experience & Pricing, 4 = Review & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  // Form State
  const [formData, setFormData] = useState<VendorOnboardingFormData>({
    // 1. Vendor & contact details
    brand_name: '',
    brand_logo_file: null,
    brand_logo_preview: '',
    spoc_name: '',
    phone_number: '',
    is_whatsapp_same_as_phone: true,
    whatsapp_number: '',
    email: '',
    website_or_instagram: '',

    // 2. Location and services
    address: '',
    city: '',
    state: 'Telangana',
    areas_served: '',
    categories: [],
    other_category: '',
    description_of_services: '',

    // 3. Experience, pricing, and portfolio
    years_of_experience: '3 - 5 years',
    share_price_after_discussion: false,
    starting_price: '',
    pricing_unit: 'Per event',
    portfolio_files: [],
    portfolio_previews: [],
    portfolio_or_social_links: '',
    events_served_specialties: [],

    // 4. Follow-up and review
    preferred_contact_method: 'Phone',
    best_time_to_contact: 'Anytime during business hours',
    confirm_accurate: false,
    permission_contact: false,
    application_status: 'Pending review' // Automatically set to Pending review
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);

  // Logo file ref
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Copy page link for sharing
  const handleCopyShareLink = () => {
    const url = window.location.origin + '/vendor-onboarding';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy application ID
  const handleCopyAppId = () => {
    if (submittedAppId) {
      navigator.clipboard.writeText(submittedAppId);
      setCopiedAppId(true);
      setTimeout(() => setCopiedAppId(false), 2500);
    }
  };

  // Handle Logo Upload with client-side compression
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, brand_logo: 'Please upload a valid image file (PNG, JPG, WebP).' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, brand_logo: 'Logo file size must be less than 10MB.' }));
      return;
    }

    try {
      // Compress logo client-side to max 800x800 for fast upload
      const comp = await imageProcessingService.processImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        format: 'jpeg'
      });
      const optimizedFile = (comp.success && comp.processedFile) ? comp.processedFile : file;
      const previewUrl = URL.createObjectURL(optimizedFile);

      setFormData((prev) => {
        if (prev.brand_logo_preview && prev.brand_logo_preview.startsWith('blob:')) {
          URL.revokeObjectURL(prev.brand_logo_preview);
        }
        return {
          ...prev,
          brand_logo_file: optimizedFile,
          brand_logo_preview: previewUrl
        };
      });

      setErrors((prev) => {
        const rest = { ...prev };
        delete rest.brand_logo;
        return rest;
      });
    } catch (err) {
      console.error('Error generating logo preview:', err);
    }
  };

  const handleRemoveLogo = () => {
    if (formData.brand_logo_preview && formData.brand_logo_preview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.brand_logo_preview);
    }
    setFormData((prev) => ({
      ...prev,
      brand_logo_file: null,
      brand_logo_preview: ''
    }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Handle Portfolio Uploads with client-side compression
  const handlePortfolioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentFiles = formData.portfolio_files || [];
    const currentPreviews = formData.portfolio_previews || [];

    if (currentFiles.length + files.length > 8) {
      setErrors((prev) => ({ ...prev, portfolio: 'You can upload up to 8 portfolio images.' }));
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const f of files) {
      if (f.type.startsWith('image/')) {
        try {
          // Compress portfolio images client-side to max 1280x1280 at 80% quality
          const comp = await imageProcessingService.processImage(f, {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 0.8,
            format: 'jpeg'
          });
          const processed = (comp.success && comp.processedFile) ? comp.processedFile : f;
          newFiles.push(processed);
          newPreviews.push(URL.createObjectURL(processed));
        } catch (err) {
          console.warn('Could not compress image preview:', err);
          newFiles.push(f);
          newPreviews.push(URL.createObjectURL(f));
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      portfolio_files: [...currentFiles, ...newFiles],
      portfolio_previews: [...currentPreviews, ...newPreviews]
    }));

    setErrors((prev) => {
      const rest = { ...prev };
      delete rest.portfolio;
      return rest;
    });

    if (portfolioInputRef.current) portfolioInputRef.current.value = '';
  };

  const handleRemovePortfolioImage = (index: number) => {
    setFormData((prev) => {
      const updatedFiles = [...(prev.portfolio_files || [])];
      const updatedPreviews = [...(prev.portfolio_previews || [])];
      
      const removedPreview = updatedPreviews[index];
      if (removedPreview && removedPreview.startsWith('blob:')) {
        URL.revokeObjectURL(removedPreview);
      }

      updatedFiles.splice(index, 1);
      updatedPreviews.splice(index, 1);
      return {
        ...prev,
        portfolio_files: updatedFiles,
        portfolio_previews: updatedPreviews
      };
    });
  };

  // Toggle Category
  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(category);
      const updated = exists
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];

      return {
        ...prev,
        categories: updated,
        other_category: !updated.includes('Other') ? '' : prev.other_category
      };
    });

    setErrors((prev) => {
      if (!prev.categories && !prev.other_category) return prev;
      const next = { ...prev };
      delete next.categories;
      return next;
    });
  };

  // Toggle Specialty
  const handleSpecialtyToggle = (item: string) => {
    setFormData((prev) => {
      const list = prev.events_served_specialties || [];
      const updated = list.includes(item)
        ? list.filter((s) => s !== item)
        : [...list, item];
      return { ...prev, events_served_specialties: updated };
    });
  };

  // Step Validations
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};
    const missing: string[] = [];

    if (step === 1) {
      // 1. Vendor & contact details
      if (!formData.brand_name.trim()) {
        errs.brand_name = 'Brand or business name is required.';
        missing.push('Brand or business name');
      }
      if (!formData.spoc_name.trim()) {
        errs.spoc_name = "Contact person's name is required.";
        missing.push("Contact person's name");
      }
      const cleanPhone = formData.phone_number.replace(/[^0-9]/g, '');
      if (!cleanPhone) {
        errs.phone_number = 'Phone number is required.';
        missing.push('10-digit Phone number');
      } else if (cleanPhone.length < 10) {
        errs.phone_number = 'Please enter a valid 10-digit mobile number.';
        missing.push('Valid 10-digit phone number');
      }

      if (!formData.is_whatsapp_same_as_phone) {
        const cleanWA = (formData.whatsapp_number || '').replace(/[^0-9]/g, '');
        if (cleanWA && cleanWA.length < 10) {
          errs.whatsapp_number = 'WhatsApp number should be at least 10 digits.';
          missing.push('Valid WhatsApp number');
        }
      }

      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          errs.email = 'Please enter a valid email address.';
          missing.push('Valid email format');
        }
      }
    } else if (step === 2) {
      // 2. Location and services
      if (!formData.city.trim()) {
        errs.city = 'City is required.';
        missing.push('City');
      }
      if (!formData.state.trim()) {
        errs.state = 'State is required.';
        missing.push('State');
      }
      if (!formData.areas_served.trim()) {
        errs.areas_served = 'Areas served is required (e.g. citywide, local districts).';
        missing.push('Areas served');
      }
      if (!formData.categories || formData.categories.length === 0) {
        errs.categories = 'Please select at least one service category.';
        missing.push('At least one Service category');
      } else if (formData.categories.includes('Other') && !formData.other_category?.trim()) {
        errs.other_category = 'Please specify your other service category.';
        missing.push('Other category specification');
      }
      if (!formData.description_of_services.trim()) {
        errs.description_of_services = 'Short description of services is required.';
        missing.push('Description of services');
      }
    } else if (step === 3) {
      // 3. Experience, pricing, and portfolio
      if (!formData.years_of_experience) {
        errs.years_of_experience = 'Years of experience is required.';
        missing.push('Years of experience');
      }
      if (!formData.share_price_after_discussion) {
        const rawPrice = formData.starting_price?.toString().trim();
        if (!rawPrice) {
          errs.starting_price = 'Please enter starting price or select "Share after discussion".';
          missing.push('Starting price or select "Share after discussion"');
        }
      }
    } else if (step === 4) {
      // 4. Follow-up and review
      if (!formData.confirm_accurate) {
        errs.confirm_accurate = 'You must confirm that these details are accurate.';
        missing.push('Confirmation checkbox');
      }
      if (!formData.permission_contact) {
        errs.permission_contact = 'You must grant permission for Happy Moments to contact you for onboarding.';
        missing.push('Permission checkbox');
      }
    }

    setErrors(errs);

    if (missing.length > 0) {
      setStepError(`Please fill in: ${missing.join(', ')}`);
      // Scroll to first invalid field so user immediately sees what to fix
      const firstFieldId = Object.keys(errs)[0];
      if (firstFieldId) {
        setTimeout(() => {
          const el = document.getElementById(firstFieldId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus?.();
          }
        }, 80);
      }
      return false;
    }

    setStepError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepError('');
      setSubmitError('');
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setStepError('');
    setSubmitError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle clicking on stepper navigation headings with strict forward validation
  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;

    // Navigating backwards to already completed steps is always allowed
    if (targetStep < currentStep) {
      setStepError('');
      setCurrentStep(targetStep);
      return;
    }

    // Trying to advance to a forward step: MUST validate all preceding steps!
    for (let s = 1; s < targetStep; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    setStepError('');
    setCurrentStep(targetStep);
  };

  // Toggle Areas served states and tags
  const handleToggleAreaServedTag = (tag: string) => {
    const current = formData.areas_served;
    const items = current
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let updatedItems: string[];
    if (items.includes(tag)) {
      updatedItems = items.filter((s) => s !== tag);
    } else {
      updatedItems = [...items, tag];
    }

    const newStr = updatedItems.join(', ');
    setFormData((prev) => ({ ...prev, areas_served: newStr }));
    if (errors.areas_served) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.areas_served;
        return next;
      });
    }
    if (stepError) setStepError('');
  };

  // Submit Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate current step
    if (!validateStep(4)) return;

    // Validate all previous steps as precaution
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setSubmitError('Please fill in all required fields in the previous steps.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitVendorOnboarding({
        ...formData,
        application_status: 'Pending review' // Automatically set to Pending review
      });

      if (result.success) {
        setSubmittedAppId(result.applicationId);
      } else {
        setSubmitError(result.error || 'Failed to submit application. Please check your connection and try again.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to submit another
  const handleResetForm = () => {
    setFormData({
      brand_name: '',
      brand_logo_file: null,
      brand_logo_preview: '',
      spoc_name: '',
      phone_number: '',
      is_whatsapp_same_as_phone: true,
      whatsapp_number: '',
      email: '',
      website_or_instagram: '',
      address: '',
      city: '',
      state: 'Telangana',
      areas_served: '',
      categories: [],
      other_category: '',
      description_of_services: '',
      years_of_experience: '3 - 5 years',
      share_price_after_discussion: false,
      starting_price: '',
      pricing_unit: 'Per event',
      portfolio_files: [],
      portfolio_previews: [],
      portfolio_or_social_links: '',
      events_served_specialties: [],
      preferred_contact_method: 'Phone',
      best_time_to_contact: 'Anytime during business hours',
      confirm_accurate: false,
      permission_contact: false,
      application_status: 'Pending review'
    });
    setSubmittedAppId(null);
    setCurrentStep(1);
    setErrors({});
  };

  // If application is submitted, show celebration confirmation screen
  if (submittedAppId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 p-8 sm:p-12 text-center relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500" />

            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 ring-8 ring-green-50 shadow-inner">
              <PartyPopper className="w-10 h-10 text-green-600 animate-bounce" />
            </div>

            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 px-3 py-1 font-semibold text-xs mb-3">
              Application Status: Pending Review
            </Badge>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Application Submitted Successfully!
            </h1>

            <p className="text-slate-600 text-base sm:text-lg mb-6 max-w-xl mx-auto">
              Thank you for registering <strong className="text-slate-900">{formData.brand_name}</strong>. We have received your vendor onboarding application and our team is currently reviewing your profile.
            </p>

            {/* Application Reference ID Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Application Reference ID</div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-slate-800 mt-0.5">{submittedAppId}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAppId}
                  className="border-slate-300 hover:bg-white text-slate-700"
                >
                  {copiedAppId ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1 text-slate-500" /> Copy ID
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Contact Person</span>
                  <span className="font-semibold text-slate-700">{formData.spoc_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-700">+91 {formData.phone_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">City</span>
                  <span className="font-semibold text-slate-700">{formData.city}, {formData.state}</span>
                </div>
              </div>
            </div>

            {/* Next Steps Roadmap */}
            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-6 text-left mb-8">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-orange-600" /> What happens next?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Review & Profile Verification</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Our vendor team reviews your services, portfolio, and location details within 24 to 48 business hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Welcome & Confirmation Call</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      We will reach out via your preferred method ({formData.preferred_contact_method}) during {formData.best_time_to_contact} to finalize setup.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Storefront Goes Live</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Your vendor profile is published to thousands of couples and event planners booking on Happy Moments.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/25 px-8"
              >
                <Link to="/">Back to Home</Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                className="w-full sm:w-auto border-slate-300 text-slate-700"
              >
                Register Another Business
              </Button>
            </div>

            <div className="mt-8 text-xs text-slate-400">
              Have urgent questions? Contact Happy Moments Partner Desk at{' '}
              <a href="tel:7330732710" className="text-orange-600 font-semibold underline">
                +91 7330732710
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col">
      {/* Top Banner with Share Link button */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                HM
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-orange-950 to-orange-800 bg-clip-text text-transparent">
                  Happy Moments
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  Partner Network
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyShareLink}
              className="text-xs font-semibold border-orange-200 text-orange-700 hover:bg-orange-50 gap-1.5 shadow-sm"
              title="Copy link to send to vendors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share Onboarding Link</span>
                  <span className="sm:hidden">Share</span>
                </>
              )}
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs text-slate-600">
              <Link to="/">Exit</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-orange-50/70 via-white to-transparent py-10 sm:py-12 border-b border-orange-100/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none px-3.5 py-1 text-xs font-bold tracking-wide uppercase mb-3">
            Vendor Partner Onboarding
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Grow Your Event Business With Happy Moments
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Register your brand to connect with couples, families, and corporate organizers looking for premier event services across India.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Stepper Navigation */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
            {[
              { num: 1, label: 'Vendor & Contact', icon: User },
              { num: 2, label: 'Location & Services', icon: MapPin },
              { num: 3, label: 'Pricing & Portfolio', icon: DollarSign },
              { num: 4, label: 'Review & Submit', icon: CheckCircle2 }
            ].map((step) => {
              const Icon = step.icon;
              const isCurrent = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => handleStepClick(step.num)}
                  className={`flex flex-col items-center p-2 sm:p-3 rounded-2xl transition-all duration-200 text-left ${
                    isCurrent
                      ? 'bg-orange-50 border-2 border-orange-500 shadow-sm cursor-default'
                      : isPast
                      ? 'bg-white border border-slate-200 hover:border-slate-300 cursor-pointer'
                      : 'bg-white border border-slate-200 hover:border-orange-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full mb-1.5 font-bold text-xs transition-colors">
                    {isPast ? (
                      <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : isCurrent ? (
                      <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
                        {step.num}
                      </span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                        {step.num}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold line-clamp-1 ${
                      isCurrent ? 'text-orange-950 font-bold' : isPast ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Global Submit Error Banner */}
        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Submission Error</p>
              <p className="mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep < totalSteps) {
                handleNext();
              } else {
                handleSubmit(e);
              }
            }}
            noValidate
          >
            {/* ======================================================== */}
            {/* STEP 1: VENDOR AND CONTACT DETAILS                        */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                    <User className="w-4 h-4" /> Step 1 of 4
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                    Vendor and Contact Details
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Tell us about your brand name, contact person, and direct communication channels.
                  </p>
                </div>

                {/* Brand or business name */}
                <div>
                  <Label htmlFor="brand_name" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    Brand or business name <span className="text-rose-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    The official name your customers know you by (recommended required).
                  </p>
                  <div className="relative">
                    <Building2 className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="brand_name"
                      type="text"
                      placeholder="e.g. Royal Wedding Moments, Sri Lakshmi Decors"
                      value={formData.brand_name}
                      onChange={(e) => {
                        setFormData({ ...formData, brand_name: e.target.value });
                        if (errors.brand_name) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.brand_name;
                            return next;
                          });
                        }
                        if (stepError) setStepError('');
                      }}
                      className={`pl-11 h-12 text-base rounded-xl ${
                        errors.brand_name ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                      }`}
                    />
                  </div>
                  {errors.brand_name && <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.brand_name}</p>}
                </div>

                {/* Brand logo (optional upload) */}
                <div>
                  <Label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>Brand logo <span className="text-xs font-normal text-slate-400">(optional upload)</span></span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-3">
                    Upload your official logo or profile avatar (JPG, PNG, or WebP up to 5MB).
                  </p>

                  {formData.brand_logo_preview ? (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <img
                        src={formData.brand_logo_preview}
                        alt="Logo preview"
                        className="w-20 h-20 rounded-xl object-cover border border-slate-300 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {formData.brand_logo_file ? formData.brand_logo_file.name : 'Uploaded Brand Logo'}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Ready for upload
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <X className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-orange-50/20"
                    >
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        Click to upload brand logo
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP up to 5MB</p>
                    </div>
                  )}
                  {errors.brand_logo && <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.brand_logo}</p>}
                </div>

                {/* Contact person's name */}
                <div>
                  <Label htmlFor="spoc_name" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    Contact person’s name <span className="text-rose-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Primary contact or proprietor name (recommended required).
                  </p>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="spoc_name"
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={formData.spoc_name}
                      onChange={(e) => {
                        setFormData({ ...formData, spoc_name: e.target.value });
                        if (errors.spoc_name) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.spoc_name;
                            return next;
                          });
                        }
                        if (stepError) setStepError('');
                      }}
                      className={`pl-11 h-12 text-base rounded-xl ${
                        errors.spoc_name ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                      }`}
                    />
                  </div>
                  {errors.spoc_name && <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.spoc_name}</p>}
                </div>

                {/* Phone number */}
                <div>
                  <Label htmlFor="phone_number" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    Phone number <span className="text-rose-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Clients and Happy Moments team will reach you here (recommended required).
                  </p>
                  <div className="flex rounded-xl overflow-hidden shadow-sm border border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                    <span className="inline-flex items-center px-4 bg-slate-100 text-slate-700 font-semibold text-sm border-r border-slate-300">
                      🇮🇳 +91
                    </span>
                    <input
                      id="phone_number"
                      type="tel"
                      maxLength={14}
                      placeholder="9876543210"
                      value={formData.phone_number}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length > 10 && val.startsWith('91')) val = val.slice(2);
                        if (val.length > 10 && val.startsWith('0')) val = val.slice(1);
                        if (val.length > 10) val = val.slice(-10);
                        setFormData({ ...formData, phone_number: val });
                        if (errors.phone_number) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.phone_number;
                            return next;
                          });
                        }
                        if (stepError) setStepError('');
                      }}
                      className="flex-1 px-4 h-12 text-base outline-none bg-white text-slate-900"
                    />
                  </div>
                  {errors.phone_number && <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.phone_number}</p>}
                </div>

                {/* WhatsApp number (optional, if different) */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-bold text-slate-800">
                        WhatsApp number <span className="text-xs font-normal text-slate-400">(optional, if different)</span>
                      </Label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Will be used to receive direct client quote requests on WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <Checkbox
                      id="same_whatsapp"
                      checked={formData.is_whatsapp_same_as_phone}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          is_whatsapp_same_as_phone: !!checked,
                          whatsapp_number: checked ? '' : formData.whatsapp_number
                        })
                      }
                    />
                    <label
                      htmlFor="same_whatsapp"
                      className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                    >
                      Same as phone number {formData.phone_number ? `(+91 ${formData.phone_number})` : ''}
                    </label>
                  </div>

                  {!formData.is_whatsapp_same_as_phone && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <Label htmlFor="whatsapp_number" className="text-xs font-bold text-slate-700 mb-1.5 block">
                        Different WhatsApp Number
                      </Label>
                      <div className="flex rounded-xl overflow-hidden shadow-sm border border-slate-300 focus-within:border-orange-500">
                        <span className="inline-flex items-center px-4 bg-slate-100 text-slate-700 font-semibold text-sm border-r border-slate-300">
                          +91
                        </span>
                        <input
                          id="whatsapp_number"
                          type="tel"
                          maxLength={10}
                          placeholder="9123456789"
                          value={formData.whatsapp_number || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, whatsapp_number: val });
                          }}
                          className="flex-1 px-4 h-11 text-base outline-none bg-white text-slate-900"
                        />
                      </div>
                      {errors.whatsapp_number && (
                        <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.whatsapp_number}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Email address (optional) */}
                <div>
                  <Label htmlFor="email" className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>Email address <span className="text-xs font-normal text-slate-400">(optional)</span></span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    For booking notifications, lead digests, and agreements.
                  </p>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. contact@yourbusiness.com"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`pl-11 h-12 text-base rounded-xl ${
                        errors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.email}</p>}
                </div>

                {/* Website or Instagram link (optional) */}
                <div>
                  <Label htmlFor="website_or_instagram" className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>Website or Instagram link <span className="text-xs font-normal text-slate-400">(optional)</span></span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Helps us review your recent past work and verify your brand portfolio.
                  </p>
                  <div className="relative">
                    <Instagram className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="website_or_instagram"
                      type="text"
                      placeholder="e.g. instagram.com/myweddings or https://mybusiness.com"
                      value={formData.website_or_instagram || ''}
                      onChange={(e) => setFormData({ ...formData, website_or_instagram: e.target.value })}
                      className="pl-11 h-12 text-base rounded-xl"
                    />
                  </div>
                </div>

                {/* Step 1 Error Banner */}
                {stepError && currentStep === 1 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm font-semibold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Please fill in required fields to continue</p>
                      <p className="text-xs text-rose-700 font-normal mt-0.5">{stepError}</p>
                    </div>
                  </div>
                )}

                {/* Continue button */}
                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                  >
                    Continue to Location & Services
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: LOCATION AND SERVICES                            */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                    <MapPin className="w-4 h-4" /> Step 2 of 4
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                    Location and Services
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Define where your business operates and the service categories you specialize in.
                  </p>
                </div>

                {/* City and State (recommend required) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      City <span className="text-rose-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">Base city of your business (recommend required).</p>
                    <Input
                      id="city"
                      type="text"
                      placeholder="e.g. Hyderabad, Vijayawada, Bengaluru"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ ...formData, city: e.target.value });
                        if (errors.city) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.city;
                            return next;
                          });
                        }
                        if (stepError) setStepError('');
                      }}
                      className={`h-12 text-base rounded-xl ${errors.city ? 'border-rose-500' : ''}`}
                    />
                    {errors.city && <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.city}</p>}
                  </div>

                  <div>
                    <Label htmlFor="state" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      State <span className="text-rose-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">State or Union Territory.</p>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full h-12 text-base rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {errors.state && <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.state}</p>}
                  </div>
                </div>

                {/* Areas served (recommend required) */}
                <div>
                  <Label htmlFor="areas_served" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    Areas served (States, Cities & Regions) <span className="text-rose-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Mention the states, cities, or districts where you provide services (e.g. Telangana, Andhra Pradesh, Karnataka, etc.).
                  </p>
                  <Input
                    id="areas_served"
                    type="text"
                    placeholder="e.g. Telangana (TS), Andhra Pradesh (AP), Hyderabad, Vijayawada, Visakhapatnam, Karnataka, Pan-India"
                    value={formData.areas_served}
                    onChange={(e) => {
                      setFormData({ ...formData, areas_served: e.target.value });
                      if (errors.areas_served) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.areas_served;
                          return next;
                        });
                      }
                      if (stepError) setStepError('');
                    }}
                    className={`h-12 text-base rounded-xl ${errors.areas_served ? 'border-rose-500' : ''}`}
                  />
                  {errors.areas_served && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.areas_served}</p>
                  )}

                  {/* Quick helper state & coverage pills */}
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-slate-500 block mb-1.5">
                      Quick select states & service coverage:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Telangana (TS)',
                        'Andhra Pradesh (AP)',
                        'Karnataka',
                        'Tamil Nadu',
                        'Maharashtra',
                        'All South India',
                        'Pan-India',
                        'Outstation Available'
                      ].map((tag) => {
                        const cleanTag = tag.replace(/\s*\(.*\)/, '').trim().toLowerCase();
                        const isSelected = formData.areas_served
                          .toLowerCase()
                          .includes(cleanTag);

                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleAreaServedTag(tag)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-900 border-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Business address (optional; ask for full address only if needed) */}
                <div>
                  <Label htmlFor="address" className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Business address <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Ask for full address only if needed (e.g. if you operate from a physical studio, showroom, or venue).
                  </p>
                  <Textarea
                    id="address"
                    rows={2}
                    placeholder="Studio / Office #, Landmark, Street name (optional)"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="rounded-xl resize-none text-base"
                  />
                </div>

                {/* Service categories (recommend required; allow multiple selections) */}
                <div>
                  <Label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    Service categories <span className="text-rose-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-3">
                    Select all event service categories that your team provides (allow multiple selections).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Service categories">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const isSelected = formData.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryToggle(cat)}
                          aria-pressed={isSelected}
                          className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-orange-200 bg-orange-50/80' : ''
                              }`}
                            >
                              {getCategoryIcon(cat)}
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-slate-900 block">{cat}</span>
                              {isSelected && (
                                <span className="text-[11px] font-medium text-orange-600">Selected</span>
                              )}
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.categories && <p className="text-xs text-rose-600 font-medium mt-2">{errors.categories}</p>}

                  {/* Other category - show if "Other" is selected */}
                  {formData.categories.includes('Other') && (
                    <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 animate-fadeIn">
                      <Label htmlFor="other_category" className="text-xs font-bold text-amber-900 block mb-1.5">
                        Please specify your other service category <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="other_category"
                        type="text"
                        placeholder="e.g. DJ & Lighting, Anchor, Mehendi Artist, Drone Coverage, Firework Display"
                        value={formData.other_category || ''}
                        onChange={(e) => setFormData({ ...formData, other_category: e.target.value })}
                        className={`h-11 bg-white text-base rounded-xl ${errors.other_category ? 'border-rose-500' : ''}`}
                      />
                      {errors.other_category && (
                        <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.other_category}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Short description of services (recommend required) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="description_of_services" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      Short description of services <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-xs text-slate-400">
                      {formData.description_of_services.length} characters
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    A brief overview of your work, signature style, team size, equipment, or what makes your service memorable.
                  </p>
                  <Textarea
                    id="description_of_services"
                    rows={4}
                    placeholder="We specialize in luxury destination weddings and candid photography. With over 8 years in the wedding industry, we offer bespoke photo books, cinematic 4K video teaser edits, and same-day highlights..."
                    value={formData.description_of_services}
                    onChange={(e) => {
                      setFormData({ ...formData, description_of_services: e.target.value });
                      if (errors.description_of_services) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.description_of_services;
                          return next;
                        });
                      }
                      if (stepError) setStepError('');
                    }}
                    className={`rounded-xl text-base ${errors.description_of_services ? 'border-rose-500' : ''}`}
                  />
                  {errors.description_of_services && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.description_of_services}</p>
                  )}
                </div>

                {/* Step 2 Error Banner */}
                {stepError && currentStep === 2 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm font-semibold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Please fill in required fields to continue</p>
                      <p className="text-xs text-rose-700 font-normal mt-0.5">{stepError}</p>
                    </div>
                  </div>
                )}

                {/* Step Navigation buttons */}
                <div className="pt-4 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    className="h-12 px-6 rounded-xl border-slate-300 text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-500/25 flex items-center gap-2"
                  >
                    Continue to Experience & Pricing
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: EXPERIENCE, PRICING, AND PORTFOLIO               */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                    <DollarSign className="w-4 h-4" /> Step 3 of 4
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                    Experience, Pricing, and Portfolio
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Help clients understand your industry experience, typical pricing, and showcase your work.
                  </p>
                </div>

                {/* Years of experience (recommend required) */}
                <div>
                  <Label htmlFor="years_of_experience" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    Years of experience <span className="text-rose-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">Total years practicing your craft in the event industry.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {EXPERIENCE_OPTIONS.map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, years_of_experience: exp }));
                          setErrors((prev) => {
                            if (!prev.years_of_experience) return prev;
                            const next = { ...prev };
                            delete next.years_of_experience;
                            return next;
                          });
                        }}
                        className={`h-12 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.years_of_experience === exp
                            ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                  {errors.years_of_experience && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.years_of_experience}</p>
                  )}
                </div>

                {/* Starting price or pricing range (recommend required, but allow "Share after discussion") */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      Starting price or pricing range <span className="text-rose-500">*</span>
                    </Label>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Recommend required, but allows choosing &ldquo;Share after discussion&rdquo; if customized per event.
                  </p>

                  {/* Toggle "Share after discussion" */}
                  <div className="flex items-center space-x-2.5 mb-4 p-3 bg-white rounded-xl border border-slate-200">
                    <Checkbox
                      id="share_price_after_discussion"
                      checked={formData.share_price_after_discussion}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          share_price_after_discussion: !!checked,
                          starting_price: checked ? '' : formData.starting_price
                        })
                      }
                    />
                    <label
                      htmlFor="share_price_after_discussion"
                      className="text-sm font-bold text-slate-800 cursor-pointer select-none"
                    >
                      Share after discussion (Custom quote on request)
                    </label>
                  </div>

                  {!formData.share_price_after_discussion ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="starting_price" className="text-xs font-bold text-slate-700 mb-1.5 block">
                          Starting Price (₹ INR) <span className="text-rose-500">*</span>
                        </Label>
                        <div className="flex rounded-xl overflow-hidden shadow-sm border border-slate-300 focus-within:border-orange-500">
                          <span className="inline-flex items-center px-4 bg-slate-100 text-slate-700 font-bold text-sm border-r border-slate-300">
                            ₹
                          </span>
                          <input
                            id="starting_price"
                            type="text"
                            placeholder="e.g. 15,000 or 25,000"
                            value={formData.starting_price || ''}
                            onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                            className="flex-1 px-4 h-11 text-base outline-none bg-white text-slate-900"
                          />
                        </div>
                        {errors.starting_price && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.starting_price}</p>
                        )}
                      </div>

                      {/* Pricing unit or package details (optional) */}
                      <div>
                        <Label htmlFor="pricing_unit" className="text-xs font-bold text-slate-700 mb-1.5 block">
                          Pricing unit or package details <span className="text-xs font-normal text-slate-400">(optional)</span>
                        </Label>
                        <Input
                          id="pricing_unit"
                          type="text"
                          placeholder="e.g. Per event, Per day, Per plate, Starting package"
                          value={formData.pricing_unit || ''}
                          onChange={(e) => setFormData({ ...formData, pricing_unit: e.target.value })}
                          className="h-11 text-base rounded-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      Starting price is set to &ldquo;Share after discussion&rdquo;. Your profile will show &ldquo;Price on Request&rdquo; to clients.
                    </div>
                  )}
                </div>

                {/* Portfolio photos (optional upload) */}
                <div>
                  <Label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Portfolio photos <span className="text-xs font-normal text-slate-400">(optional upload)</span>
                    </span>
                    <span className="text-xs font-normal text-slate-500">
                      {formData.portfolio_previews?.length || 0} / 8 photos
                    </span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-3">
                    Upload your best recent event work photos to showcase to clients (up to 8 images, max 6MB each).
                  </p>

                  <div
                    onClick={() => portfolioInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-orange-50/20 mb-4"
                  >
                    <input
                      ref={portfolioInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handlePortfolioChange}
                    />
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">Click or drag photos to add to portfolio</p>
                    <p className="text-xs text-slate-400 mt-1">Upload event decoration, photography, venue, or setup images</p>
                  </div>

                  {errors.portfolio && <p className="text-xs text-rose-600 font-medium mb-3">{errors.portfolio}</p>}

                  {/* Portfolio Previews Grid */}
                  {formData.portfolio_previews && formData.portfolio_previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.portfolio_previews.map((preview, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-sm">
                          <img src={preview} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePortfolioImage(idx)}
                            className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full p-1 opacity-90 group-hover:opacity-100 transition-colors"
                            title="Remove photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Portfolio or social media links (optional) */}
                <div>
                  <Label htmlFor="portfolio_or_social_links" className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Portfolio or social media links <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Google Drive folder, Behance, YouTube channel, Instagram highlights, or cloud folder link.
                  </p>
                  <div className="relative">
                    <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="portfolio_or_social_links"
                      type="text"
                      placeholder="e.g. drive.google.com/drive/folders/... or behance.net/myportfolio"
                      value={formData.portfolio_or_social_links || ''}
                      onChange={(e) => setFormData({ ...formData, portfolio_or_social_links: e.target.value })}
                      className="pl-11 h-12 text-base rounded-xl"
                    />
                  </div>
                </div>

                {/* Events served or specialties (optional) */}
                <div>
                  <Label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Events served or specialties <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-3">
                    Click to select common event types you cater to.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SPECIALTIES.map((spec) => {
                      const isSelected = (formData.events_served_specialties || []).includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => handleSpecialtyToggle(spec)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step Navigation buttons */}
                <div className="pt-4 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    className="h-12 px-6 rounded-xl border-slate-300 text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-500/25 flex items-center gap-2"
                  >
                    Continue to Review & Confirm
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: FOLLOW-UP AND REVIEW                             */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                    <CheckCircle2 className="w-4 h-4" /> Step 4 of 4
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                    Follow-up and Review
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Review your application summary, set follow-up preferences, and confirm submission.
                  </p>
                </div>

                {/* Application status info box (automatic "Pending review") */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950">
                    <div className="font-bold text-sm">
                      Application Status: <Badge className="ml-1 bg-amber-500 text-white font-semibold">Pending review</Badge>
                    </div>
                    <p className="mt-1 text-amber-900/80">
                      Your application will be submitted directly to our vendor relations team with status <strong>Pending review</strong>. No action is required from your side until our review is complete.
                    </p>
                  </div>
                </div>

                {/* Contact Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Preferred way to contact them (optional) */}
                  <div>
                    <Label className="text-sm font-bold text-slate-800 block mb-1">
                      Preferred way to contact you <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">How should Happy Moments team reach out?</p>
                    <select
                      value={formData.preferred_contact_method}
                      onChange={(e: any) =>
                        setFormData({ ...formData, preferred_contact_method: e.target.value })
                      }
                      className="w-full h-11 text-sm rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Phone">Phone Call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="Any">Any method</option>
                    </select>
                  </div>

                  {/* Best time to contact (optional) */}
                  <div>
                    <Label className="text-sm font-bold text-slate-800 block mb-1">
                      Best time to contact <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">Convenient time window for onboarding call.</p>
                    <select
                      value={formData.best_time_to_contact}
                      onChange={(e) => setFormData({ ...formData, best_time_to_contact: e.target.value })}
                      className="w-full h-11 text-sm rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {CONTACT_TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary Review Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-600" /> Application Summary
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
                    >
                      Edit details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Brand Name</span>
                      <span className="font-bold text-slate-800 text-sm">{formData.brand_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contact Person</span>
                      <span className="font-semibold text-slate-800">{formData.spoc_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone & WhatsApp</span>
                      <span className="font-semibold text-slate-800">
                        +91 {formData.phone_number} {formData.whatsapp_number ? `(WA: +91 ${formData.whatsapp_number})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">City & State</span>
                      <span className="font-semibold text-slate-800">
                        {formData.city}, {formData.state}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Areas Served</span>
                      <span className="font-semibold text-slate-800">{formData.areas_served || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Experience</span>
                      <span className="font-semibold text-slate-800">{formData.years_of_experience}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Starting Price</span>
                      <span className="font-semibold text-slate-800">
                        {formData.share_price_after_discussion
                          ? 'Share after discussion'
                          : `₹ ${formData.starting_price} ${formData.pricing_unit ? `(${formData.pricing_unit})` : ''}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Portfolio Uploads</span>
                      <span className="font-semibold text-slate-800">
                        {formData.portfolio_previews?.length || 0} photo(s) attached
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 text-xs block mb-1.5">Selected Categories</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.categories.map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs bg-white text-slate-800 border border-slate-200">
                          {c === 'Other' && formData.other_category ? `${c}: ${formData.other_category}` : c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mandatory Confirmations */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                    <Checkbox
                      id="confirm_accurate"
                      checked={formData.confirm_accurate}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, confirm_accurate: !!checked })
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="confirm_accurate"
                        className="text-sm font-semibold text-slate-800 cursor-pointer block"
                      >
                        I confirm these details are accurate <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        I certify that the business information, portfolio, and contact numbers provided are true and belong to our event business.
                      </p>
                      {errors.confirm_accurate && (
                        <p className="text-xs text-rose-600 font-medium mt-1">{errors.confirm_accurate}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                    <Checkbox
                      id="permission_contact"
                      checked={formData.permission_contact}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, permission_contact: !!checked })
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="permission_contact"
                        className="text-sm font-semibold text-slate-800 cursor-pointer block"
                      >
                        Permission for Happy Moments to contact them about vendor onboarding <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        I allow Happy Moments partner relations team to contact me via phone, WhatsApp, or email to assist with vendor onboarding, verification, and lead dispatch.
                      </p>
                      {errors.permission_contact && (
                        <p className="text-xs text-rose-600 font-medium mt-1">{errors.permission_contact}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step Navigation buttons */}
                <div className="pt-4 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isSubmitting}
                    className="h-12 px-6 rounded-xl border-slate-300 text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-base h-12 px-8 rounded-xl shadow-xl shadow-orange-500/25 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Vendor Application
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Happy Moments. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-800 underline">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-slate-800 underline">
              Support
            </Link>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Copy Page Link
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VendorOnboarding;

