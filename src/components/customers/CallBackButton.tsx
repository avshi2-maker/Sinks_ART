'use client';

// src/components/customers/CallBackButton.tsx
// Phase 19 Stage B — Click to dial customer phone (tel: link) or copy to clipboard.

import { useState } from 'react';

interface Props {
  phone: string;
}

export default function CallBackButton({ phone }: Props) {
  const [copied, setCopied] = useState(false);

  // Clean phone: remove spaces, dashes, parentheses for tel: link
  const telPhone = phone.replace(/[\s\-()]/g, '');
  const telHref = 'tel:' + telPhone;

  async function handleCopy(e: React.MouseEvent) {
    // On desktop: prevent dialer, copy to clipboard instead
    if (window.matchMedia('(hover: hover)').matches) {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback: let the tel: link work (will fail gracefully on desktop without handler)
      }
    }
    // On mobile: tel: link fires naturally
  }

  return (
    <a
      href={telHref}
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md no-underline transition-colors shadow-sm"
      dir="ltr"
    >
      <span aria-hidden="true">📞</span>
      <span>{copied ? '✓ הועתק ללוח' : 'חזור ללקוח'}</span>
    </a>
  );
}
