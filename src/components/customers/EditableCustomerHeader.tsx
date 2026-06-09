'use client';

// src/components/customers/EditableCustomerHeader.tsx
// Phase 35c — toggles the customer header between display and edit (shared ContactForm).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerHeader } from './CustomerHeader';
import ContactForm, { ContactFormData } from '@/components/shared/ContactForm';
import { updateCustomer } from '@/lib/customers/customerMutations';
import type { CustomerRow } from '@/lib/customers/types';

export default function EditableCustomerHeader({ customer }: { customer: CustomerRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function handleSave(data: ContactFormData) {
    const res = await updateCustomer({
      id: customer.id,
      name_he: data.name_he,
      phone: data.phone,
      city: data.city,
      email: data.email,
      profession: data.profession,
      notes: data.notes,
    });
    if (res.ok) { setEditing(false); router.refresh(); }
    return res;
  }

  if (editing) {
    return (
      <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6 shadow-sm" dir="rtl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-stone-800">עריכת לקוח</span>
          <button onClick={() => setEditing(false)} className="text-xs text-stone-500 hover:text-stone-700">✕ סגור</button>
        </div>
        <ContactForm
          initial={{
            name_he: customer.name_he || '',
            phone: customer.phone || '',
            profession: customer.profession || '',
            email: customer.email || '',
            city: customer.city || '',
            notes: customer.notes || '',
          }}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          saveLabel="שמור שינויים"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setEditing(true)} className="absolute top-3 left-3 z-10 text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200">✏️ ערוך</button>
      <CustomerHeader customer={customer} />
    </div>
  );
}
