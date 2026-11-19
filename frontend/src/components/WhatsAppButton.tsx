// Formerly a WhatsApp click-to-chat button to the vendor. Phase 1 removes every
// direct shortcut to vendors, so this now sends the customer to the greeting card,
// which opens a Happy Moments group chat with the vendor. The name and props are
// kept so existing pages keep working without changes.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareQuote } from 'lucide-react';
import { quoteLink } from '@/utils/vendorPrivacy';

interface WhatsAppButtonProps {
  vendor: {
    vendor_id: string | number;
    spoc_name?: string;
    brand_name?: string;
    category?: string | string[];
    whatsapp_number?: string;
    phone_number?: string;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode; // ignored: the label is always "Request quote"
  onClick?: () => void;
}

const sizeClasses = { sm: 'px-2 py-1 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-lg' };
const iconClasses = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };

// Callers styled the old button green; drop those colours so it looks like the brand CTA.
const withoutGreen = (cls: string) =>
  cls.split(/\s+/).filter((c) => !/(^|:)(bg|from|to|via)-green-/.test(c)).join(' ');

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ vendor, className = '', size = 'md', onClick }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        navigate(quoteLink(vendor as any));
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#F57C00] font-semibold text-white transition hover:bg-[#E26A00] ${sizeClasses[size]} ${withoutGreen(className)}`}
    >
      <MessageSquareQuote className={iconClasses[size]} />
      <span>Request quote</span>
    </button>
  );
};

export default WhatsAppButton;
