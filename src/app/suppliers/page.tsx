// src/app/suppliers/page.tsx
// Suppliers report: directory of suppliers + captured price offers, each row edit/delete, make-draft per offer.

import { fetchSuppliers, fetchSupplierOffers, fetchCustomersForOffer } from '@/lib/suppliers/suppliersData';
import SuppliersReport from '@/components/suppliers/SuppliersReport';
import { fetchActiveOptions } from '@/lib/options/optionsCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuppliersPage() {
  const [suppliers, offers, customers, options] = await Promise.all([fetchSuppliers(), fetchSupplierOffers(), fetchCustomersForOffer(), fetchActiveOptions()]);
  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-stone-800">ספקים והצעות מחיר</h1>
        <p className="text-sm text-stone-500 mt-1">{offers.length} הצעות · {suppliers.length} ספקים</p>
      </div>
      <SuppliersReport suppliers={suppliers} offers={offers} customers={customers} options={options} />
    </div>
  );
}


