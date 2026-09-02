<!-- marker: sinks inventory v1 02092026 — COMPLETE code-derived component registry -->
# SINKS_ART (Marble Art CRM) — COMPLETE COMPONENT INVENTORY (A–Z) 🗂️

> ⛔ **MANDATORY FIRST READ before building, proposing, or "fixing" ANYTHING.**
> Exhaustive registry generated from the actual code on **02/09/2026**. One job: **no duplicates, no overkill.** If it's listed here it **EXISTS** — improve it, never rebuild it.
> Companion to `SKILL.md` (rules #7–#35), `STATUS.md` (session log), `IDEAS_PARKING.md` (North Star + roadmap).
> **Keep it true:** after any new route/API/table, say **"refresh the Sinks inventory"** → re-scan + regenerate.
> Counts (02/09/2026): **30 pages · 12 API routes · ~85 libs · ~110 components · ~30 tables**.

## 0. ⛔ ANTI-DUPLICATE LIST — already exists, never rebuild
| Thing | Exists as | Note |
|---|---|---|
| **Call intake (audio→text→analyze→save)** | `/(internal)/sinc` + `/api/sinc-transcribe` (ElevenLabs) + `/api/sinc-analyze` (Claude) + `components/sinc/CallProcessingFlow.tsx` | The reference flow. |
| **Media intake + photo/mp4 analysis** | `/(internal)/intake` + `/api/analyze-photo` + `components/intake/analyzers/PhotoAnalyzer,Mp4Analyzer` | New analyzers MUST reuse `ApiCostMeter`+`ExportFooter` (Rule #11). |
| **Customer CRM (detail + timeline)** | `/(internal)/customers` + `/customers/[id]` + `components/customers/*` (CommsTimeline, ProjectsList…) | |
| **Quote engine** | `/quotes` + `/quotes/[id]` + `components/pricing/PricingEngine` + `components/quotes/*` + `/api/quotes/[id]/docx` | Word export exists. |
| **Offer builder (ARVO)** | `components/offers/OfferBuilder` + `arvo_offers` + `PriceBreaksManager` + `/material-calc` | |
| **PO / work orders** | `/po` `/po/[id]` `/po/[id]/ales` + `lib/po/createWorkOrderFromSketch` + `components/po/ales/*` | |
| **Sites (parent entities, e.g. hotels)** | `/sites` `/sites/[id]` + `components/sites/*` | |
| **Leads inbox** | `/leads` + `components/leads/LeadsInbox` + `leads` table | Public site (other repo) writes leads here. |
| **Doors module** | `/lib/doors/*` + `components/doors/DoorConfigurator,DoorOfferLine` + `door_catalog` | |
| **AI prompt builder (Nano Banana)** | `/(internal)/prompt-builder` + `/customers/[id]/prompt-builder` + `components/prompt-builder/*` | |
| **Sketch builder / sketch→offer** | `/sketch` `/sketch-to-offer` + `components/sketch/*` + `lib/sketch/*` | |
| **Trabelsi purchasing** | `/trabelsi-po` + `components/purchasing/*` + `trabelsi_orders` | |
| **WhatsApp correspondence sorter** | `/api/sort-correspondence` + `lib/sorter/*` + `components/sorter/*` | |
| **Shared infra (do NOT re-create)** | `components/shared/`: `ApiCostMeter` `ExportFooter` `TopNav` `WorkflowNav` `EntityPicker` `PhoneInput` · `lib/shared/exportFormats.ts` | |
| **Public marketing site** | SEPARATE repo `sinks-bathroom-design` (marble-art.co.il) — **shares this Supabase + Cloudinary** | Leads flow public → this CRM. |

## 1. STACK & IDENTIFIERS
- Next.js (App Router) · TypeScript strict · Tailwind RTL · shadcn/ui · Hebrew RTL.
- Repo `avshi2-maker/Sinks_ART` → Vercel `sinks-art` → **crm.marble-art.co.il** (private, password gate). Local `C:\SinkS\Sinks_ART`.
- **Supabase `givcxgzhfoetujhrjgvc`** (shared with the public marketing repo). Cloudinary `dqdku88vv`. AI: `claude-sonnet-4-6`. Transcribe: ElevenLabs Scribe.

## 2. PAGES (routes) — every `page.tsx`
**Public:** `/` marketing landing · `/marble` · `/demos` · `/sketch` · `/sketch-to-offer`
**Auth:** `/login`
**CRM cockpit:** `/dashboard` · `/(internal)/customers` (index) · `/(internal)/customers/[id]` (detail) · `/(internal)/customers/[id]/prompt-builder` · `/(internal)/intake` (media) · `/(internal)/sinc` (call intake) · `/(internal)/tasks` · `/(internal)/prompt-builder`
**Sales pipeline:** `/leads` (inbox) · `/pipeline` · `/quotes` · `/quotes/[id]` · `/offers-sent` · `/arvo-offer` · `/material-calc` · `/roi` (metrics, read-only)
**Sites/projects:** `/sites` · `/sites/[id]`
**Production/purchasing:** `/po` · `/po/[id]` · `/po/[id]/ales` (work order) · `/trabelsi-po` · `/suppliers` · `/ales-settings`

## 3. API ROUTES — every `route.ts`
| Route | Purpose |
|---|---|
| `/api/sinc-transcribe` | Audio → ElevenLabs Scribe (Hebrew) |
| `/api/sinc-analyze` | Transcript → Claude analysis |
| `/api/analyze-photo` | Photo → Claude vision |
| `/api/analyze-dm` | Analyze a DM / pasted message |
| `/api/analyze-supplier` | Supplier-offer analysis |
| `/api/extract-items` | Price text → {item, price, remark} rows (Phase 30) |
| `/api/sort-correspondence` | WhatsApp blob → tagged messages (Phase 29) |
| `/api/quotes/[id]/docx` | Quote → RTL Word draft (VAT incl., RFQ images) |
| `/api/supplier-offers/[id]/docx` | Supplier offer → Word |
| `/api/login` · `/api/logout` | crm_auth cookie session |

## 4. LIBRARIES — `src/lib` (grouped by domain)
**customers/** attachOffer · commMutations · contactMutations · customerMutations · deleteComm · fetchContacts · fetchCustomerPage · fetchCustomersList · intakeMutations · intakeTypes · mediaLink · projectMutations · types
**quotes/** archiveQuote · deleteQuote · fetchQuotes · markQuoteSent · quickQuoteActions · rfqImages · saveQuoteLines · types · units
**offers/** arvoOffersData · arvoOffersTypes · createOfferFromEngine · materialCalc · materialCalcToSketch · materialSettings · offerTypes · priceBreaksData · saveOffer
**pricing/** alesCostCalc · alesCostData · alesCostTypes · enginePrefill
**po/** alesSnapshot · createWorkOrderFromSketch · poData · sketchSpecToDims · workOrderFinance · workOrderTypes
**sinc/** apiMeter · claudeAnalysis · cloudinaryAudio · elevenlabs · prompts · supabaseSinc · types
**intake/** claudeVision · cloudinary · detectMediaType · prompts (+ tests)
**sites/** deleteSite · siteDocuments · siteDocumentsTypes · siteMutations · sitesData
**doors/** doorCatalogData · doorCatalogTypes
**leads/** leadsData · **pipeline/** jobPipelineData · jobPipelineTypes · **roi/** roiData
**purchasing/** trabelsiOrders · trabelsiPoData · **sketch/** sketchRenderer · workshopSheet
**sorter/** draftOffer · extractItems · saveSortedMessages · sortCorrespondence
**marble/** marbleData · **options/** optionsCatalog · **addons/** addonsData · **rfq/** rfqData · **suppliers/** suppliersData
**shared/** exportFormats · fetchMonthCost · phoneValidation · **dashboard/** archiveActions · fetchTasks · taskMutations
**root:** supabase · promptBuilderActions · promptTemplates

## 5. COMPONENTS — `src/components` (grouped)
**customers/** AddCustomerForm · AddNoteInlineForm · AddProjectForm · AttachOfferButton · CallBackButton · CommsFilterTabs · CommsTimeline · ContactsPanel · CustomerHeader · CustomersTable · EditableCustomerHeader · MediaBoard · ProjectStatusBadge · ProjectsList
**dashboard/** ActiveProjectsList · AddTaskInlineForm · ArchiveButton · DashboardPipelineStrip · FlowLauncher · QuickActions · RecentCommsFeed · TaskRow · TasksStrip · TodayActivityStrip · TodayFollowups
**quotes/** DeleteQuoteButton · QuickQuotePanel · QuoteDetail · QuoteDocxExport · QuoteLineEditor · QuoteRowActions · QuoteView · RfqImages
**offers/** MaterialCalculator · OfferBuilder · OffersSentTracker · PriceBreaksManager · **pricing/** AlesCostSettingsForm · PricingEngine · PricingEngineTab
**po/** PoAssetsConfirm · PoDocument · PoList · PoSendBar · **po/ales/** AlesCostPage · AlesDocument · AlesHeroPage · AlesSketchPage
**sinc/** AudioFilePicker · CallProcessingFlow · SaveCustomerModal · **intake/** CustomerPicker · MediaInput · analyzers/PhotoAnalyzer · analyzers/Mp4Analyzer
**sites/** AddSiteForm · DeleteSiteButton · SiteContacts · SiteDocuments · SiteProjects · SiteTasks · SiteVisits
**doors/** DoorConfigurator · DoorOfferLine · DoorsManager · **leads/** LeadsInbox · PastedLeadIntake · **pipeline/** PipelineBoard
**prompt-builder/** GeometryFields · MediaInputPanel · PromptBuilderShell · PromptOutputCard · SketchGalleryPicker
**purchasing/** TrabelsiOrdersRegister · TrabelsiPoBuilder · TrabelsiPoTabs · **sketch/** MarbleBrowser · SaveSketchToGallery · SketchBuilder · **sorter/** CorrespondenceSorter · DraftOfferBuilder
**rfq/** AlesRfqForm · RfqCreateForm · **marble/** MarbleManager · **addons/** AddonsManager · **options/** AddOptionForm · OptionRowEditor · **suppliers/** SuppliersReport · **demos/** DemoCard · DemoUploader · GalleryGrid
**shared/** ApiCostMeter · ContactForm · EntityPicker · ExitButton · ExportFooter · LiveClock · PhoneInput · TopNav · TopNavLink · WorkflowNav

## 6. DATABASE — tables (via code usage; authoritative list in Supabase `givcxgzhfoetujhrjgvc`)
**CRM core:** `customers` · `customer_contacts` · `customer_communications` · `projects` · `media_analyses` · `tasks`
**Sales:** `quotes` · `quote_lines` · `arvo_offers` · `rfqs` · `rfq_responses` · `leads` · `job_pipeline` · `demo_trials`
**Production/purchasing:** `production_orders` · `po_counter` · `suppliers` · `supplier_offers` · `trabelsi_orders` · `trabelsi_material_settings`
**Sites:** `sites` · `site_tasks` · `site_documents` · `site_contacts` · `site_visits`
**Catalog/pricing:** `door_catalog` · `marble_swatches` · `addons_catalog` · `options_catalog` · `ales_price_breaks` · `ales_cost_settings`
**Schema files:** `supabase/*.sql` (phase15 … phase41, quote_engine_costs, tasks_table, quotes_tables).

## 7. HOW TO REFRESH
Say **"refresh the Sinks inventory"** → Claude re-scans `src/app`, `src/lib`, `src/components`, `supabase/*.sql`, regenerates this file, bumps the marker date, commits + pushes.
