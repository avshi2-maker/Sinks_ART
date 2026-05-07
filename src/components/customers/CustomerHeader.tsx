// src/components/customers/CustomerHeader.tsx
// Phase 16 — Customer top section (name, contact, source, status badge).
// Server component (pure display, no interactivity).

import type { CustomerRow } from '@/lib/customers/types';

interface Props {
  customer: CustomerRow;
}

const SOURCE_LABEL_HE: Record<string, string> = {
  phone: 'שיחת טלפון',
  whatsapp: 'וואטסאפ',
  email: 'מייל',
  website: 'אתר',
  referral: 'הפניה',
  instagram: 'אינסטגרם',
  facebook: 'פייסבוק',
  other: 'אחר',
};

export function CustomerHeader({ customer }: Props) {
  const sourceLabel = customer.source
    ? (SOURCE_LABEL_HE[customer.source] ?? customer.source)
    : null;
  const createdDate = new Date(customer.created_at).toLocaleDateString('he-IL');
  const cleanName = customer.name_he.trim().replace(/\s+/g, ' ');

  return (
    <header className="bg-white border border-stone-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">{cleanName}</h1>
          {customer.name_en ? (
            <p className="text-sm text-stone-500 mb-3" dir="ltr">{customer.name_en}</p>
          ) : null}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {customer.phone ? (
              <div>
                <span className="font-medium text-stone-600">טלפון: </span>
                <span className="text-stone-900" dir="ltr">{customer.phone}</span>
              </div>
            ) : null}
            {customer.email ? (
              <div>
                <span className="font-medium text-stone-600">מייל: </span>
                <span className="text-stone-900" dir="ltr">{customer.email}</span>
              </div>
            ) : null}
            {customer.city ? (
              <div>
                <span className="font-medium text-stone-600">עיר: </span>
                <span className="text-stone-900">{customer.city}</span>
              </div>
            ) : null}
            {sourceLabel ? (
              <div>
                <span className="font-medium text-stone-600">מקור: </span>
                <span className="text-stone-900">{sourceLabel}</span>
              </div>
            ) : null}
            <div>
              <span className="font-medium text-stone-600">נוצר בתאריך: </span>
              <span className="text-stone-900">{createdDate}</span>
            </div>
          </dl>

          {customer.notes ? (
            <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded text-sm text-stone-700">
              <span className="font-medium">הערות: </span>
              {customer.notes}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          {customer.is_active ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              פעיל
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-200 text-stone-600">
              לא פעיל
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
