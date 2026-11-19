import React, { useState, useEffect } from 'react';
import { hideVendorContact, hideVendorsContact, quoteLink } from '@/utils/vendorPrivacy';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  MapPin, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Phone, 
  MessageCircle,
  Eye,
  Calendar,
  Camera,
  Flower2,
  Users,
  Award,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vendor } from '@/lib/supabase';
import { getAllVendors } from '@/services/supabaseService';
import { isCategoryMatch } from '@/constants/categories';

const FILTER_TABS = [
  { id: 'all', label: 'All Verified' },
  { id: 'Event Planners', label: 'Event Planners' },
  { id: 'Photography/Videography', label: 'Photographers' },
  { id: 'Decorators', label: 'Decorators' },
  { id: 'Makeup Artists', label: 'Makeup Artists' },
  { id: 'Caterers', label: 'Caterers' },
  { id: 'Venues', label: 'Venues' }
];

const FeaturedVendorsSection: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApprovedVendors = async () => {
      try {
        setLoading(true);
        const all = await getAllVendors();
        // Show verified & available vendors, recently created/updated first
        const verifiedOnly = (all || []).filter(
          (v) => v.verified === true && v.currently_available !== false
        );
        setVendors(hideVendorsContact(verifiedOnly));
      } catch (err) {
        console.error('Error fetching approved vendors for homepage:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedVendors();
  }, []);

  // Filter vendors based on active tab
  const displayedVendors = vendors.filter((v) => {
    if (activeTab === 'all') return true;
    const cats: string[] = Array.isArray(v.category)
      ? v.category
      : (Array.isArray(v.categories) ? v.categories : [v.category].filter(Boolean));
    return cats.some((cat) => isCategoryMatch(cat, activeTab));
  }).slice(0, 8); // Showcase up to top 8 on the homepage

  // Resolve cover image for vendor
  const resolveVendorImage = (vendor: Vendor): string => {
    if (vendor.cover_image_url) return vendor.cover_image_url;
    if (vendor.avatar_url) return vendor.avatar_url;
    const photos = vendor.additional_info?.portfolio_photos;
    if (Array.isArray(photos) && photos.length > 0 && photos[0]) {
      return photos[0];
    }
    if (vendor.additional_info?.brand_logo_url) {
      return vendor.additional_info.brand_logo_url;
    }
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
  };

  // Format price
  const formatPrice = (price?: number | string): string => {
    if (!price) return 'Price on Request';
    const num = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price;
    if (isNaN(num) || num <= 0) return 'Price on Request';
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Format location
  const resolveLocation = (vendor: Vendor): string => {
    if (vendor.additional_info?.city && vendor.additional_info?.state) {
      return `${vendor.additional_info.city}, ${vendor.additional_info.state}`;
    }
    if (vendor.address) {
      const parts = vendor.address.split(',');
      if (parts.length >= 2) {
        return `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
      }
      return vendor.address;
    }
    return 'Hyderabad, Telangana';
  };

  // Contact goes through a Happy Moments group, never straight to the vendor's WhatsApp.
  const handleWhatsAppChat = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    navigate(quoteLink(vendor));
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white via-orange-50/20 to-white relative overflow-hidden">
      {/* Decorative blurred glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              Verified & Handpicked
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-wedding-navy tracking-tight">
              Featured Approved Vendors
            </h2>
            <p className="text-slate-600 mt-3 text-base md:text-lg max-w-2xl">
              Connect directly with verified professionals who bring unforgettable moments to life for your wedding and celebrations.
            </p>
          </div>

          <Link
            to="/vendors"
            className="inline-flex items-center gap-2 text-sm md:text-base font-bold text-orange-600 hover:text-orange-700 transition-colors group self-start md:self-auto"
          >
            Explore All Approved Vendors
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Vendors Grid */}
        {!loading && displayedVendors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedVendors.map((vendor) => {
              const image = resolveVendorImage(vendor);
              const locationStr = resolveLocation(vendor);
              const cats = Array.isArray(vendor.category)
                ? vendor.category
                : (Array.isArray(vendor.categories) ? vendor.categories : [vendor.category].filter(Boolean));

              return (
                <div
                  key={vendor.vendor_id}
                  onClick={() => navigate(`/vendor/${vendor.vendor_id}`)}
                  className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1"
                >
                  {/* Image & Badges */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={image}
                      alt={vendor.brand_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Verified Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                      Verified
                    </div>

                    {/* Pricing Pill */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-[11px] font-medium text-slate-200 uppercase tracking-wider">Starts From</p>
                      <p className="text-base font-extrabold">{formatPrice(vendor.starting_price)}</p>
                    </div>

                    {/* Rating Pill */}
                    {(vendor.rating || 0) > 0 && (
                      <div className="absolute bottom-3 right-3 bg-amber-500/90 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        {Number(vendor.rating).toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Categories Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {cats.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60"
                          >
                            {c}
                          </span>
                        ))}
                        {cats.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{cats.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Brand Name */}
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {vendor.brand_name}
                      </h3>

                      {/* SPOC & Location */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{locationStr}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleWhatsAppChat(e, vendor)}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold h-9 rounded-xl transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Request quote
                      </Button>

                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold h-9 rounded-xl shadow-sm"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedVendors.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <Award className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No approved vendors found in this category yet</h3>
            <p className="text-sm text-slate-500 mt-1">Check back soon or explore other wedding categories.</p>
            <Button
              onClick={() => setActiveTab('all')}
              variant="outline"
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              Show All Verified Vendors
            </Button>
          </div>
        )}

        {/* Bottom Call to Action */}
        <div className="mt-12 text-center">
          <Link
            to="/vendors"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm md:text-base shadow-xl shadow-slate-900/10 transition-all hover:scale-105"
          >
            Browse All {vendors.length}+ Verified Vendors
            <ArrowRight className="w-4 h-4 text-orange-400" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedVendorsSection;

