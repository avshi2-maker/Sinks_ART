/**
 * src/components/sinc/SaveCustomerModal.tsx
 *
 * Modal that appears when the user clicks "✓ אשר ושמור" on a completed
 * /sinc analysis. Lets the user:
 *   1. Pick an existing customer from a searchable list
 *   2. OR create a new customer (name + optional phone + notes)
 *   3. Pick an existing active project for the customer, OR auto-create a new "ליד"
 *   4. Confirm save
 *
 * On confirm, calls onConfirm({ customerId, projectId }) where projectId
 * may be null (signaling auto-create).
 *
 * Phase D — Save flow (Session 18, 06/05/2026)
 */

'use client';

import { useEffect, useState } from 'react';
import {
  listCustomers,
  listActiveProjectsForCustomer,
  createCustomer,
} from '@/lib/sinc/supabaseSinc';
import type { SincCustomerRow, SincProjectRow } from '@/lib/sinc/types';

interface Props {
  /** Pre-fill suggestions extracted by Claude from the call. */
  suggestedName:  string;
  suggestedPhone: string;
  /** Called when the user confirms. project_id null = auto-create lead project. */
  onConfirm:      (sel: { customer_id: string; project_id: string | null }) => void;
  /** Called when the user cancels (X or backdrop). */
  onCancel:       () => void;
}

type Tab = 'pick' | 'new';

export default function SaveCustomerModal({
  suggestedName,
  suggestedPhone,
  onConfirm,
  onCancel,
}: Props) {
  const [tab, setTab]                       = useState<Tab>('pick');
  const [loading, setLoading]               = useState<boolean>(true);
  const [error, setError]                   = useState<string>('');

  // Pick tab
  const [customers, setCustomers]           = useState<SincCustomerRow[]>([]);
  const [searchQuery, setSearchQuery]       = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<SincCustomerRow | null>(null);

  // Project picker (shown after a customer is selected)
  const [projects, setProjects]             = useState<SincProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'NEW' | ''>('');

  // New customer tab
  const [newName, setNewName]               = useState<string>(suggestedName || '');
  const [newPhone, setNewPhone]             = useState<string>(suggestedPhone || '');
  const [newNotes, setNewNotes]             = useState<string>('');
  const [creating, setCreating]             = useState<boolean>(false);

  // ── Load customers on mount ──
  useEffect(() => {
    let mounted = true;
    listCustomers()
      .then((rows) => { if (mounted) { setCustomers(rows); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(String(e?.message || e)); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  // ── Load projects when a customer is selected ──
  useEffect(() => {
    if (!selectedCustomer) {
      setProjects([]);
      setSelectedProjectId('');
      return;
    }
    let mounted = true;
    setProjectsLoading(true);
    setSelectedProjectId('');
    listActiveProjectsForCustomer(selectedCustomer.id)
      .then((rows) => {
        if (!mounted) return;
        setProjects(rows);
        // Default selection: most recent project, or 'NEW' if none
        setSelectedProjectId(rows.length > 0 ? rows[0].id : 'NEW');
        setProjectsLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(String(e?.message || e));
        setProjectsLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedCustomer]);

  // ── Filtered customer list ──
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      c.name_he.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  // ── Handlers ──

  function handleConfirmPick() {
    if (!selectedCustomer) {
      setError('יש לבחור לקוח');
      return;
    }
    const projectId = selectedProjectId === 'NEW' || !selectedProjectId ? null : selectedProjectId;
    onConfirm({ customer_id: selectedCustomer.id, project_id: projectId });
  }

  async function handleCreateAndConfirm() {
    if (!newName.trim()) {
      setError('שם לקוח חובה');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const newCust = await createCustomer(newName, newPhone, newNotes);
      // New customer has no projects yet -> auto-create lead project
      onConfirm({ customer_id: newCust.id, project_id: null });
    } catch (e) {
      setError(String((e as Error)?.message || e));
      setCreating(false);
    }
  }

  // ── Render ──

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
      dir="rtl"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="text-base font-medium text-gray-900">
            <span>💾 שמירת השיחה</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="סגור"
          >
            <span>×</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex">
          <button
            type="button"
            onClick={() => { setTab('pick'); setError(''); }}
            className={'flex-1 px-4 py-2 text-sm ' + (tab === 'pick' ? 'bg-blue-50 text-blue-700 font-medium border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50')}
          >
            <span>🔍 לקוח קיים</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('new'); setError(''); }}
            className={'flex-1 px-4 py-2 text-sm ' + (tab === 'new' ? 'bg-blue-50 text-blue-700 font-medium border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50')}
          >
            <span>➕ לקוח חדש</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              <span>⚠️ {error}</span>
            </div>
          )}

          {tab === 'pick' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-gray-500 text-center py-6">
                  <span>טוען לקוחות...</span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש לפי שם / טלפון / מייל..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-600"
                  />

                  <div className="border border-gray-200 rounded max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">
                        <span>אין תוצאות</span>
                      </div>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isSelected = selectedCustomer?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCustomer(c)}
                            className={'w-full text-right px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ' + (isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50')}
                          >
                            <div className="font-medium">{c.name_he}</div>
                            {(c.phone || c.email) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {c.phone || ''}{c.phone && c.email ? ' · ' : ''}{c.email || ''}
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Project picker */}
                  {selectedCustomer && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
                      <div className="text-xs font-medium text-gray-700">
                        <span>שייך לפרויקט של {selectedCustomer.name_he}:</span>
                      </div>
                      {projectsLoading ? (
                        <div className="text-sm text-gray-500">
                          <span>טוען פרויקטים...</span>
                        </div>
                      ) : (
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value as string | 'NEW')}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title_he} ({p.status})
                            </option>
                          ))}
                          <option value="NEW">
                            ✨ פרויקט חדש (ייווצר אוטומטית)
                          </option>
                        </select>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'new' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <span>שם הלקוח *</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-600"
                  placeholder={suggestedName || 'שם מלא'}
                />
                {suggestedName && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span>💡 מצויין בשיחה: {suggestedName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <span>טלפון</span>
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-600"
                  placeholder={suggestedPhone || '050-...'}
                  dir="ltr"
                />
                {suggestedPhone && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span>💡 מצויין בשיחה: {suggestedPhone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <span>הערות</span>
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-600 min-h-[60px]"
                  placeholder="הערות פנימיות (אופציונלי)"
                />
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
                <span>📝 ייווצר פרויקט חדש "ליד" אוטומטית עם תאריך השיחה.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 flex gap-2 justify-start">
          <button
            type="button"
            onClick={tab === 'pick' ? handleConfirmPick : handleCreateAndConfirm}
            disabled={creating || (tab === 'pick' && !selectedCustomer) || (tab === 'new' && !newName.trim())}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {creating ? '💾 יוצר לקוח...' : (tab === 'pick' ? '✓ שמור לשיחה' : '➕ צור לקוח ושמור')}
            </span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={creating}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
          >
            <span>ביטול</span>
          </button>
        </div>
      </div>
    </div>
  );
}
