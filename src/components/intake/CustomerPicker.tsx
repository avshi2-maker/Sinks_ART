/**
 * CustomerPicker.tsx
 *
 * Dropdown of active customers with their current project status as a badge.
 * Reports the selected customer + their active project up to the parent
 * via the onSelect callback.
 *
 * Reuses the data shape from SinC-ART v11's loadCustomersIntoSelect, but as
 * a proper React component with TypeScript types.
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 04/05/2026
 */

'use client';

import { useEffect, useState } from 'react';
import {
  supabase,
  CLOSED_STATUSES,
  Customer,
  Project,
  CustomerWithProject,
} from '@/lib/supabase';

interface Props {
  /** Called whenever the user picks a customer (or null when cleared). */
  onSelect: (selection: CustomerWithProject | null) => void;
  /** Optional pre-selected customer id on mount. */
  initialCustomerId?: string;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export default function CustomerPicker({ onSelect, initialCustomerId }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [rows, setRows] = useState<CustomerWithProject[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialCustomerId || '');

  // Load customers + their most recent active project on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState('loading');
      setErrorMsg('');

      const customersPromise = supabase
        .from('customers')
        .select('id, name_he, phone, email, source, is_active')
        .eq('is_active', true)
        .order('name_he', { ascending: true });

      const projectsPromise = supabase
        .from('projects')
        .select('id, customer_id, title_he, status, notes, updated_at')
        .order('updated_at', { ascending: false });

      const [custRes, projRes] = await Promise.all([customersPromise, projectsPromise]);

      if (cancelled) return;

      if (custRes.error) {
        setLoadState('error');
        setErrorMsg('שגיאה בטעינת לקוחות: ' + custRes.error.message);
        return;
      }
      if (projRes.error) {
        setLoadState('error');
        setErrorMsg('שגיאה בטעינת פרויקטים: ' + projRes.error.message);
        return;
      }

      const customers = (custRes.data || []) as Customer[];
      const projects = (projRes.data || []) as Project[];

      // Build customer_id → most recent active project map
      const activeByCustomer = new Map<string, Project>();
      for (const p of projects) {
        if (CLOSED_STATUSES.includes(p.status)) continue;
        if (activeByCustomer.has(p.customer_id)) continue; // we sorted desc — first wins
        activeByCustomer.set(p.customer_id, p);
      }

      const merged: CustomerWithProject[] = customers.map((c) => ({
        customer: c,
        activeProject: activeByCustomer.get(c.id) || null,
      }));

      setRows(merged);
      setLoadState('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // When the selection changes (or rows finish loading with an initial id), notify parent
  useEffect(() => {
    if (loadState !== 'ready') return;
    if (!selectedId) {
      onSelect(null);
      return;
    }
    const found = rows.find((r) => r.customer.id === selectedId);
    onSelect(found || null);
  }, [selectedId, rows, loadState, onSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(e.target.value);
  };

  return (
    <div className="customer-picker">
      <label htmlFor="customer-select" className="block text-sm font-medium mb-1">
        לקוח:
      </label>

      {loadState === 'loading' && (
        <div className="text-sm text-gray-500 py-2">טוען לקוחות...</div>
      )}

      {loadState === 'error' && (
        <div className="text-sm text-red-600 py-2">{errorMsg}</div>
      )}

      {loadState === 'ready' && (
        <>
          <select
            id="customer-select"
            value={selectedId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            dir="rtl"
          >
            <option value="">— בחר לקוח —</option>
            {rows.map(({ customer, activeProject }) => {
              const status = activeProject ? activeProject.status : 'חדש';
              const phone = customer.phone ? ' · ' + customer.phone : '';
              const source = customer.source ? ' · (' + customer.source + ')' : '';
              return (
                <option key={customer.id} value={customer.id}>
                  {customer.name_he + phone + source + ' · [' + status + ']'}
                </option>
              );
            })}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            ✓ נטענו {rows.length} לקוחות
          </div>
        </>
      )}
    </div>
  );
}
