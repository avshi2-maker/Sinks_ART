# MARBLE ART CRM — SESSION HANDOVER (BREAK)
_Written: 06 July 2026 ~midday · supersedes HANDOVER_060720261036.md_
_Commit: e146b41 pushed to main · Vercel auto-deploy triggered_

## HOW WE WORK (unchanged — respect exactly)
Avshi is NOT a coder — copy-paste + architect. ENGLISH correspondence, HEBREW applications.
Complete files only (download + PowerShell move block, check project root AND Downloads).
ONE command per message. Business questions separate. NOTHING deleted without item-by-item
approval. Backups in /_backups/. Never `npm run build` while dev server runs.

## ✅ DONE THIS SESSION (all 3 items from morning handover CLOSED)
1. **Marble wizard FIXED (FlowLauncher.tsx):** the half-edit from yesterday is repaired.
   Complete file rebuilt + delivered — 🪨 "כיור: שרטוט ← אלס ← טרבלסי" flow now FIRST in
   FLOWS array (6 steps: שרטוט → מחשבון חומר → הזמנת אלס /po → טרבלסי /trabelsi-po →
   הצעת ARVO → מעקב). Default `useState('marble2ziv')` now matches a real flow.
   Backup saved: _backups/FlowLauncher_backup_06072026.tsx. Verified working locally.
2. **/po archive filter VERIFIED:** poData.ts line 95 has `.eq('is_archived', false)` —
   it DID land yesterday. Confirmed with eyes on /po.
3. **Two NEW accidental POs archived:** PO-2026-0022 + PO-2026-0023 (both ₪13,570, created
   6.7 with no customer) were accidental — archived via SQL. DB verified clean:
   **only PO-2026-0019 (₪12,800) + PO-2026-0021 (₪20,983) active.** Column name note:
   production_orders uses `po_number` (NOT order_number) and `agreed_cost_ils`.
4. **Build green** (✓ Compiled, ✓ TypeScript, 40+ routes) → committed + pushed (e146b41):
   FlowLauncher.tsx + poData.ts + HANDOVER_060720261036.md.

## 🔴 TO DO AFTER BREAK (in order)
1. **Production eyes-check (5 min):** Vercel deploy should be done. Open
   crm.marble-art.co.il/dashboard → 🪨 wizard appears FIRST in "מה עכשיו?" and opens by
   default. Then /po → only 0019 + 0021 (hard-refresh Ctrl+Shift+R).
2. **Stray file decision (approval needed):** `trabelsi-po-page.tsx` sits in repo ROOT —
   dead leftover download (real page works at /trabelsi-po, confirmed in build). Proposal:
   move to _backups/. Scar-tissue #30 risk: stray root .tsx can break future builds.
   NOT touched — waiting for Avshi's item-by-item approval.
3. **Untracked files decision:** HANDOVER_ales_workorder_button.md +
   _RETIRED.md + Ziv Excel files (Ziv_two_sinks_FINAL_05072026.xlsx + analysis) sit
   untracked in root. Decide: commit to repo (continuity) or move to _backups/. Avshi's call.
4. **Parked (not urgent):** Next.js deprecation warning "middleware → proxy" appears on
   every build. Cosmetic for now; schedule a rename session someday.

## 💰 ZIV DEAL STATE (unchanged — business follow-ups OPEN)
213 ₪12,800 SENT · 295 ₪20,983 ready · package ₪32,433 (after ₪1,350 shared-transport
discount — **still needs Ales OK**). Trabelsi TRB-2026-0001 = both sinks · 7 sheets ·
₪6,895 · גוון 610977. Follow-ups: (a) Ales confirm discount + nesting 7→6 sheets;
(b) architect confirm counter material (terrazzo/black slate) + wall type for Damari/Harel
Sagron shop drawings.

## 💡 IDEAS PARKED (unchanged)
#14–21 in IDEAS_PARKING.md — shop-drawing generator, detail library, render presentations,
field-survey sheets, "any input → sketch + price" pipeline, sketch→Nano Banana, Instagram
revival, ARVO supplier-PO template, ROI פעילות cleanup.

## RESTART
Fresh chat: "Marble Art CRM, continuing. Read HANDOVER_06072026_BREAK.md in repo root
C:\SinkS\Sinks_ART. First: production eyes-check (wizard + /po), then decide stray
trabelsi-po-page.tsx + untracked files."
