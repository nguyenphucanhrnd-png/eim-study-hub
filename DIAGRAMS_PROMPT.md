# SUPER PROMPT — Interactive Diagrams Upgrade (EIM Study Hub v2)

> **How to use:** put this file in the project root next to `PROMPT.md`, `KNOWLEDGE_BASE.md` and `source-pdfs/`. In Claude Code type:
> `Read DIAGRAMS_PROMPT.md, KNOWLEDGE_BASE.md and PROMPT.md in full, then execute DIAGRAMS_PROMPT.md phase by phase.`

---

## 0. CONTEXT & GOAL

The site (EIM Study Hub, deployed at https://eim-study-hub.vercel.app/) is already built from `PROMPT.md`: theory, MCQ practice, 12 mock exams, case studies, tools. The UI/UX is good and **must be kept**.

What is missing: the **diagrams and process flows from the lecturer's slides**. Students read lists of steps but never *see* how goods, documents and money move between parties. This upgrade adds:

1. **A reusable interactive diagram engine** (SVG, data-driven).
2. **One interactive diagram for every diagram/process in the slides** (inventory in §4), embedded in the right place in each chapter.
3. **A master "End-to-End Trade Journey"** that connects all chapters into one flow, reconfigured live by Incoterms rule + payment method.
4. **Learning interactions on top of each diagram**: click a step → see what happens, play the flow, quiz modes (order the steps, who does it), and links to practice questions.

Learning goal: after using a diagram, a student can **(a)** list the steps in order, **(b)** say who does each step and what document/money moves, **(c)** explain *why* the step exists and what goes wrong if it is skipped.

---

## 1. NON-NEGOTIABLE RULES

1. **Do not break anything that works.** Keep all existing routes, data, store keys and styles. Extend existing components instead of duplicating them (see Phase 0).
2. **Content accuracy:** all step content comes from `KNOWLEDGE_BASE.md` + the diagram spec in §4 of this file (verified against the slide PDFs). The PDFs in `source-pdfs/` are the visual reference for layout and arrow numbering. **Do not invent steps, actors, numbers or rules.** If something is unclear, stop and ask me.
3. **Every diagram has a provenance label:**
   - `slide` = redrawn from a slide diagram (show "Sơ đồ từ slide – Chương X, trang Y").
   - `derived` = built from slide *text*, not a slide figure (show "Sơ đồ tổng hợp từ nội dung slide"). Derived diagrams are lower priority (Phase 5).
4. **Numbering must match the slide** for `slide` diagrams. If two slides number the same process differently (L/C 9-step vs Figure 11.3), show both and explain the difference — never merge them silently.
5. **Language:** UI and step explanations in **Vietnamese**; English technical terms kept (as on slides). Step titles show EN (slide wording) + VI.
6. Work **phase by phase** (§9); stop at every ⏸ CHECKPOINT.
7. TypeScript strict, no `any`, short comments on non-obvious logic, commit after each phase with a clear message.

---

## 2. KB AMENDMENTS (apply to `KNOWLEDGE_BASE.md` in Phase 0)

I re-checked the slide PDFs. Update the KB as follows and keep a changelog line at the top of §9:

**A1 — Resolve ERRATA E-09 (T/T diagrams are legible).** Replace E-09 with "Resolved" and add this to KB §5.3:
- *T/T payment in advance (slide C5 p.7):* (1) Importer → Importer's bank: instructs the remittance · (2) Importer's bank → Exporter's bank: transfers the money · (3) Importer's bank → Importer: debit advice/confirmation · (4) Exporter's bank → Exporter: credits the money · (5) Exporter → Importer: ships the goods.
- *T/T deferred payment (slide C5, "Remittance deferred payment procedure"):* (1) Exporter → Importer: ships the goods · (2) Importer → Importer's bank: instructs the remittance · (3) Importer's bank → Importer: debit advice/confirmation · (4) Importer's bank → Exporter's bank: transfers the money · (5) Exporter's bank → Exporter: credits the money.
- Steps (2)/(3) labels "instructs" / "debit advice" are the standard meaning of those arrows → tag `[EXT]` in the explanation; the arrow direction and order are from the slide.

**A2 — Add L/C arrow map (slide C5 p.20).** Arrows on the slide diagram: (1) Importer→Issuing bank · (2) Issuing→Advising · (3) Advising→Exporter · (4) Exporter→Importer "Goods" · (5) Exporter→Advising · (6) Advising→Issuing · (7) Issuing→Advising · (8) Issuing→Importer · (9) Advising→Exporter. These match the 9-step text already in KB §5.5.

**A3 — Add Figure 11.3 map (slide C5 p.21, US seller NY ↔ Canadian buyer Montreal), tagged `derived-order`** (the figure has numbered arrows but no step text; meaning inferred from arrow endpoints):
1 Seller ↔ Buyer: sales contract with L/C payment · 2 Buyer → Issuing bank: applies for L/C · 3 Issuing → Advising/confirming bank: sends L/C · 4 Advising/confirming → Seller: advises (confirms) L/C · 5 Seller → Carrier: ships goods, receives B/L · 6 Seller ↔ Advising/confirming bank: presents documents, gets paid · 7 Advising/confirming → Issuing: forwards documents · 8 Issuing → Advising/confirming: reimburses · 9 Issuing → Buyer: releases documents · 10 Buyer → Carrier: presents B/L, collects goods · 11 Buyer → Issuing: pays / account debited.

**A4 — New ERRATA E-14 (Incoterms C-rules cost row).** The slide *tables* for CFR, CIF, CPT, CIP say "Division of costs: seller pays costs until delivered", but the slide *diagrams* for the same rules show the seller's COSTS arrow running to the destination (main carriage paid). The diagrams match ICC Incoterms® 2020. → In diagrams and explanations, **follow the diagrams** (two critical points: risk passes at origin, seller pays main carriage to destination). Handling: (T), explanation must mention the "two critical points". Also fix the sentence in KB §3.8 "General rule in every slide table…" to add "except main carriage (and insurance for CIF/CIP) which the seller pays to destination under C-rules".

**A5 — Note E-15 (L/C step 9).** Slide says the advising bank pays the seller. `[EXT]` note: under UCP 600 a bank pays/negotiates only if it is the nominated or confirming bank; the advising bank alone only advises. Keep the slide flow; add the note in the step panel.

---

## 3. ENGINE ARCHITECTURE

### 3.1 Libraries
- **Hand-built SVG + React** for diagrams (layouts are fixed and must mirror the slides; do NOT use React Flow).
- **`motion`** (Framer Motion) for token animation along edges — lazy-loaded with the diagram routes.
- **`@dnd-kit/core` + `@dnd-kit/sortable`** for the "order the steps" quiz (keyboard-accessible drag).
- No other new dependencies without asking me.

### 3.2 Folder structure
```
src/features/diagrams/
  engine/
    types.ts            # DiagramSpec, Node, Edge, Step, Token… (+ Zod schemas)
    DiagramCanvas.tsx   # renders nodes/edges/labels in an SVG viewBox
    StepPanel.tsx       # right-side (desktop) / bottom sheet (mobile) detail panel
    PlayerControls.tsx  # ◀ ▶ ⏯ step counter, speed, reset
    FlowToken.tsx       # animated token (goods / document / money / info) moving along an edge
    Legend.tsx
    MobileStepList.tsx  # vertical timeline fallback < 768px
    modes/
      ExploreMode.tsx   # click any node/edge/step
      PlayMode.tsx      # auto step-through
      OrderQuiz.tsx     # drag steps into correct order
      ActorQuiz.tsx     # "Ai làm bước này?" – labels hidden, click the actor
      GapQuiz.tsx       # one step blanked, choose the missing step (4 options)
    useDiagramProgress.ts  # Zustand slice: steps viewed, quizzes passed
  specs/                # one file per diagram, e.g. c5-lc-basic.ts
  journey/              # master End-to-End Trade Journey (§5)
    buildJourney.ts     # pure function: (rule, payment, mode) → JourneyStep[]
    JourneyPage.tsx
  DiagramHub.tsx        # /diagrams page
  DiagramEmbed.tsx      # <DiagramEmbed id="c5-lc-basic" /> used inside theory pages
```

### 3.3 Data model (implement + validate with Zod)
```ts
type FlowKind = "goods" | "document" | "money" | "info";   // drives edge style + token icon
type ActorRole = "seller" | "buyer" | "sellerBank" | "buyerBank" | "carrier"
               | "customsExport" | "customsImport" | "insurer" | "other";

interface DiagramNode {
  id: string;
  label: string;          // EN, as on slide
  labelVi?: string;
  role: ActorRole;        // drives color: seller = blue, buyer = amber, banks = slate, carrier = teal…
  x: number; y: number; w?: number; h?: number;   // in a 1000×600 viewBox, mirroring the slide layout
  shape?: "ellipse" | "rect" | "pill";            // ellipse for C5 bank diagrams (as on slide)
}
interface DiagramEdge {
  id: string; from: string; to: string;
  kind: FlowKind;
  label?: string;         // e.g. "(5)" or "goods"
  curve?: number;         // offset for parallel arrows (e.g. L/C (2)/(6)/(7))
}
interface DiagramStep {
  id: string;
  order: number;                 // slide number
  title: string;                 // EN slide wording
  titleVi: string;
  edgeIds: string[];             // edges highlighted / animated in this step
  actors: string[];              // node ids performing the step
  what: string;                  // VI – what happens (2–3 sentences)
  why: string;                   // VI – why it matters / what risk it controls
  documents?: string[];          // e.g. ["Bill of Lading", "Commercial Invoice"] → link to C7 glossary
  trap?: string;                 // VI – common exam trap
  ext?: string;                  // [EXT] note, only from KB EXT content
  source: string;                // "KB §5.5 · Slide C5 p.20"
  practiceTopic?: string;        // topic id from PROMPT.md §5.1 → deep link to practice
}
interface DiagramSpec {
  id: string; chapter: "C1"|"C2"|"C3"|"C4"|"C5"|"C6"|"C7"|"C8";
  title: string; titleVi: string;
  provenance: "slide" | "derived";
  slideRef?: string;             // "C5 p.20"
  nodes: DiagramNode[]; edges: DiagramEdge[]; steps: DiagramStep[];
  variants?: { id: string; label: string; patch: Partial<DiagramSpec> }[]; // e.g. D/P vs D/A, FCA case A/B
  keyTakeaways: string[];        // VI, 3–5 bullets shown under the diagram
  quiz?: { order?: boolean; actor?: boolean; gap?: boolean };
}
```

### 3.4 Visual language (consistent across ALL diagrams)
- **Edge style by flow kind** (shown in the Legend, and never by color alone — also by dash pattern + icon):
  - goods = solid thick line, box icon
  - document = dashed line, document icon
  - money = solid line, coin icon
  - info/instruction = dotted line, envelope icon
- **Actor colors:** seller = blue, buyer = amber (same as the existing Incoterms Explorer), banks = slate, carrier = teal, customs = violet, insurer = green. Use existing theme tokens; must work in dark mode.
- Step number badges sit on the edge exactly where the slide puts them.
- Current step: edge + actors highlighted, everything else at 30% opacity. Visited steps get a small check mark.
- Respect `prefers-reduced-motion`: replace token travel with an instant highlight.

### 3.5 Interaction model (every diagram)
| Interaction | Behavior |
|---|---|
| **Click a node** | Panel shows the actor: role in this diagram, which steps it takes part in (clickable), related chapter links |
| **Click an edge / step badge / step in list** | Panel shows the step (what / why / documents / trap / ext / source) + button **"Luyện câu hỏi về bước này"** → `/practice?topic=<practiceTopic>` |
| **Play** | Auto-advance every 3 s (speed 0.5×/1×/2×); token travels along the edge; panel follows the step. Keyboard: `←/→` prev/next, `Space` play/pause, `Esc` close panel |
| **Variant toggle** | Segmented control above the canvas (e.g. D/P ↔ D/A); diff steps flash briefly so the student sees what changed |
| **Quiz: Sắp xếp các bước** | Shuffled step cards → drag into order → check → wrong positions shown in red with the correct number |
| **Quiz: Ai làm bước này?** | Node labels hidden; for each step the student clicks the acting node; score shown |
| **Quiz: Bước còn thiếu** | One step blanked; choose the missing step among 4 (distractors = steps from *other* diagrams, e.g. a D/P step inside the L/C flow) |
| **Progress** | Diagram counts as "Đã khám phá" when all steps viewed; "Đã thành thạo" when one quiz scored 100%. Shown on chapter page, `/diagrams` hub and dashboard |
| **Mobile (< 768px)** | Canvas stays visible (pinch/scroll inside a fixed-height frame) + `MobileStepList` vertical timeline below it; panel becomes a bottom sheet |
| **Accessibility** | Nodes and edges are focusable `<g role="button" tabindex="0" aria-label="Bước 5: …">`; `aria-live` region announces the current step; visible focus ring; full keyboard flow |

### 3.6 Where diagrams appear
- **Inside each chapter page** (`/learn/:chapterId`): `<DiagramEmbed id="…" />` inserted at the matching theory section (not at the end), with a collapsible "Mở sơ đồ tương tác" header showing step count + estimated time. Add a "Sơ đồ" entry in the chapter TOC.
- **`/diagrams` hub:** grid grouped by chapter, each card shows title, provenance badge (Slide / Tổng hợp), step count, progress state. Add to the sidebar.
- **`/journey`:** the master flow (§5). Add to the sidebar and as a Dashboard quick button "Hành trình xuất nhập khẩu".
- **From MCQ explanations:** if the question's `topic` maps to a diagram step (map in `src/features/diagrams/topicMap.ts`), show a button "Xem trên sơ đồ" that opens the diagram focused on that step.

---

## 4. DIAGRAM INVENTORY (build exactly these)

Priority: **P1** = slide diagrams (must have) · **P2** = derived diagrams (Phase 5).
Page numbers are approximate — verify against `source-pdfs/` and fix the `slideRef` if needed.

### C1 — Overview

**D1.1 `c1-export-process` · P1 · slide "What is an export? – Export process: From seller's factory to buyer in foreign country"**
- Layout: horizontal chain of 9 stations in three zones with headers *Seller's country | International transport | Buyer's country*; customs boxes above stations 3 and 7; document tray below each side.
- Steps (goods edges): 1 Seller's factory → 2 Packing & loading at origin → 3 Export customs clearance (export declaration, document check, customs inspection, export release) → 4 Port/airport of loading → 5 International transport (sea, air or other) → 6 Port/airport of discharge → 7 Import customs clearance (import declaration, document check, inspection, **import duties & taxes payment**, release) → 8 Inland transport to buyer → 9 Buyer's premises.
- Extra interaction: toggle **"Hiện chứng từ"** → document chips appear: export docs (Commercial Invoice, Packing List, Export Declaration, B/L / AWB, C/O if required, other certificates if required) and import docs (Import Declaration, B/L / AWB, Commercial Invoice, Packing List, C/O if required, other certificates). Clicking a chip opens the C7 theory anchor.
- Quiz: order (9 steps); "Seller's country or buyer's country?" sorting.

**D1.2 `c1-two-flows` · P1 · slide "Export Management – Manage two key flows"**
- Two lanes. Top lane = **Outflow of goods** (left→right, 9 stations as on this slide: seller's factory, packing & loading, export customs, origin transport to port/airport, international transport, destination transport, import customs, inland transport to buyer, buyer's premises). Bottom lane = **Inflow of foreign exchange** (right→left): A Buyer pays per contract → B Buyer's bank processes and remits → C Payment methods (L/C, T/T, D/P, D/A, other) → D Seller's bank receives FX and credits the account → E Seller receives FX.
- Play mode animates both lanes in parallel to show they are **two separate flows coordinated by export management**.
- Side panel "Managed through": Planning & Coordination, Documentation, Risk Management, Control & Monitoring.
- Extra interaction **"Môn học nằm ở đâu trên 2 dòng chảy?"**: 6 chips (Planning & Preparation, Pricing & Incoterms, Cargo Insurance, International Payment, International Sale Contract, Documents & Procedures). Clicking a chip highlights the part it governs, per KB §1.5: plan both flows · allocate cost/risk in goods flow · protect goods flow · manage financial flow · legally connect both flows · enable and control both flows. Below: the chain *Right goods → Right place → Right time → Right documents → Right payment → Acceptable risk*.

**D1.3 `c1-order-process` · P1 · slide "Export Order Process"**
- 4 stages: Quotation (price quotation) → Order entry → Shipment → Collection. Small, inline. Each stage links to the chapter that covers it (Quotation → C3 pricing/Incoterms; Order entry → C6 contract; Shipment → C7/C8; Collection → C5).

**D1.4 `c1-stakeholder-hub` · P1 · slide Figure 1-6 "Interrelationships with outside service providers"**
- Hub-and-spoke: center = VP (Director) Export/Import Operations Department; spokes exactly as in KB §1.8 (VP Marketing → Customers; VP Purchasing → Suppliers; Treasury/Accounting–Banks; Information Systems; Legal; Manufacturing; Transportation Carriers; Freight Forwarders; Customs Brokers; Insurance Companies and Sureties; Packing Companies; Government Agencies; Translators; Consulates; Preshipment Inspection Companies).
- Filter: internal departments vs external providers.
- Clicking a provider shows **only KB-backed links**, never invented job descriptions: e.g. Banks → C5 payment methods; Insurance companies → C4; Carriers → issue the B/L (C7); Freight forwarders / customs brokers → logistics intermediaries (C2 §2.7); Customs → C8 clearance; Preshipment inspection → Inspection Certificate (C7); Chamber of Commerce / VCCI → C/O (C6 example, C7). Also show the 12 "players" list (KB §1.9) and the coordinator role (KB §1.10 role 2).

### C2 — Planning (no slide diagram)
**D2.1 `c2-export-plan` · P2 · derived** — 9 components of the export plan as a clickable ring/canvas; each opens its content (KB §2.2–2.10). Overlay "11 câu hỏi chuẩn bị xuất khẩu" mapped to the component each question belongs to. (The existing FX calculator stays as is.)

### C3 — Pricing & Incoterms

**D3.1 `c3-pricing-objectives` · P1 · slide "Pricing objectives and pricing strategy"**
- Two branches: (Maximize sales / Increase market share / Convey image of discounts) → (Minimum price, same price for all markets) → (Penetration pricing, Cost-based pricing); and (Achieve a desired profit level / Convey image of prestige) → (Maximum price, different prices for markets) → (Price skimming, Demand-based pricing). Double arrow between the two strategy boxes as on the slide.
- Interaction: click an objective → path lights up; mini-classifier with 6 short scenarios (written from KB definitions only) → student picks the branch.

**D3.2 `c3-incoterms-purpose-scope` · P1 · slide infographic "Purpose / Scope of Incoterms"**
- 4 purpose cards + 3 "DO NOT cover" cards (transfer of title, payment terms/methods, breach of contract) + key point. Interaction: drag-sort quiz "Incoterms quy định / không quy định".

**D3.3 `c3-carriage-incoterms` · P1 · slides "Pre-carriage, main-carriage, on-carriage" + the 11 ICC rule diagrams (COSTS / RISKS / INSURANCE arrows)**
- **Upgrade the existing Incoterms Explorer** rather than building a second one. Base strip = the slide's chain: Seller's premises → Packaging → Loading → Export customs clearance → THC (origin) → Main transport → THC (destination) → Import customs clearance → Unloading → Buyer's premises, with brackets *Pre-carriage / Main-carriage / On-carriage*.
- Rule selector (11 rules, grouped E/F/C/D and "any mode" vs "sea & inland waterway"). For the selected rule draw, exactly like the ICC slide diagrams: **COSTS** arrow (blue → amber at cost transfer point), **RISKS** arrow (blue → amber at delivery point), **INSURANCE** arrow (CIF/CIP only), "Export formalities" and "Import formalities" badges colored by responsible party.
- **C-rules:** animate the "two critical points" — risk marker at origin (on board / first carrier), cost marker at destination (E-14). Tooltip: "CIF Hamburg ≠ rủi ro chuyển ở Hamburg".
- **FCA:** variant toggle *Giao tại cơ sở người bán (đã bốc lên phương tiện)* vs *Giao tại nơi khác (trên phương tiện của người bán, sẵn sàng dỡ)* — both slide diagrams.
- **DAP vs DPU vs DDP:** variant shows unloaded vs ready for unloading vs cleared for import.
- New interaction **"Sự cố trên đường"**: student drops an incident marker anywhere on the strip (e.g. "hàng rơi khi bốc lên tàu", "tàu gặp bão giữa biển", "hỏng khi dỡ ở cảng đích") → panel answers from the rule data: who bears the risk at that point, who paid the freight for that segment, whether the seller had to insure (CIF ICC(C) / CIP ICC(A)) or the risk-bearer may insure at its discretion. Logic is a pure function with tests.
- Compare mode (2 rules side by side) stays.

**D3.4 `c3-2010-vs-2020` · P2 · slide table** — 7 change cards with a 2010 ⇄ 2020 flip; keep compact.

### C4 — Cargo insurance (slides have tables, no flow diagram)
- The existing ICC Coverage Checker stays.
**D4.1 `c4-subrogation` · P2 · derived from KB §4.3** — 4-step flow: goods damaged in transit (carrier at fault) → insured claims the insurer (needs insurable interest) → insurer pays the insured → insurer **stands in the insured's position** and claims against the carrier. Variant: "người mua không có quyền lợi được bảo hiểm" → claim rejected (explain insurable interest).
**D4.2 Link** the D3.3 incident simulator to the ICC checker: choosing a peril in the incident shows A/B/C coverage (respect E-04: theft/nondelivery rows show the slide value + footnote, never used to decide a quiz answer).

### C5 — International payment (highest priority chapter)

**D5.1 `c5-tt-advance` · P1 · slide C5 p.7** — four ellipses in the slide layout (Exporter's bank top-left, Importer's bank top-right, Exporter bottom-left, Importer bottom-right). Steps per KB amendment A1. Key takeaway: money moves **before** goods → risk on the buyer (KB "Risks for buyer" + "When to use cash-in-advance").
**D5.2 `c5-tt-deferred` · P1 · slide "Remittance deferred payment procedure"** — same layout, steps per A1. Key takeaway: goods first, money later → risk on the exporter. Add a **side-by-side toggle Advance ⇄ Deferred** that animates how step order flips.

**D5.3 `c5-documentary-collection` · P1 · slide Figure 11.2** — Seller (top-left), Buyer (top-right), Seller's bank/remitting bank (bottom-left), Buyer's bank/collecting bank (bottom-right). 7 steps exactly as KB §5.4.
- **Variant D/P ⇄ D/A** (sight draft vs time draft): step 5 changes from "buyer pays → receives documents" to "buyer accepts (signs) the time draft → receives documents, pays at maturity"; steps 6–7 change from "remits payment" to "advises acceptance". For D/A add a dashed step "5b – Payment at maturity" labelled from the KB definition ("pay at a later date").
- Token detail: show the **documents token held at the collecting bank** until payment (D/P) or acceptance (D/A) — this is the key concept.
- Bill of exchange mini-card: drawer = exporter, drawee = importer, beneficiary; sight vs time draft.
- Risk callout (KB): no bank guarantee of payment; 4 conditions when the seller should accept DC.

**D5.4 `c5-lc-basic` · P1 · slide "Documentary credit procedures" (p.20)** — Advising bank top-left, Issuing bank top-right, Exporter bottom-left, Importer bottom-right; parallel arrows (2)/(6)/(7) between banks offset with `curve`; steps = 9-step text in KB §5.5, arrows per amendment A2.
- Node panels name the alternative titles: Applicant / Beneficiary / Issuing (Opening) bank / Advising or Confirming (Paying) bank.
- Step panels add: step 2 → L/C contents (13 items) collapsible; step 3 → exporter's L/C checklist (14 items) as a tickable checklist; step 5 → presentation within 21 days after shipment & within validity (link to the L/C Date Checker tool); step 6/7 → discrepancies (accidental / minor / major); step 9 → E-15 note.
- Key takeaways: banks deal with **documents, not goods**; bank's promise replaces buyer's credit risk.

**D5.5 `c5-lc-fig113` · P1 · slide Figure 11.3 (p.21)** — 5 boxes incl. **Carrier**; 11 steps per amendment A3 with a visible note "Thứ tự diễn giải từ các mũi tên của Figure 11.3". Toggle **"So sánh với sơ đồ 9 bước"** that shows a mapping table between the two numberings (e.g. 9-step (4) Goods ≈ Fig 11.3 (5) Seller→Carrier; Fig 11.3 adds (1) contract and (10) buyer presents B/L to carrier).
- Key teaching point: the carrier releases goods only against the B/L → why the B/L is a **document of title** (link to C7 B/L functions).

**D5.6 `c5-consignment-openaccount` · P2 · derived** — two mini flows: Consignment (ship → importer sells to a third party → importer pays → title passes on payment) and Open account (ship + mail documents separately → pay within 30–120 days).
**D5.7 `c5-method-compare` · P1 (built on existing Payment Flow Stepper)** — one horizontal timeline per method (Cash-in-advance, L/C, D/P, D/A, Open account, Consignment) showing the **order of three events: goods shipped · documents released · money paid**. Hover = who is exposed in the gap. Risk ladder labelled `[EXT – Trade Finance Guide]` as in the KB. Quiz: "Khách hàng mới, quốc gia rủi ro chính trị cao → chọn phương thức?" using KB "when to use" criteria only.

### C6 — Sale contract (no slide diagram)
**D6.1 `c6-contract-anatomy` · P2 · derived** — 3 phases (parties → 14 articles → signatures). Clicking an article shows "must specify" items + common mistakes (KB §6.3–6.17). **Dependency lines** between articles that must be consistent: Price (Incoterms rule + place + version) ↔ Delivery ↔ Insurance (CIF/CIP) ↔ Documents (insurance certificate); Payment (L/C, UCP 600) ↔ Documents (B/L "to order of issuing bank", freight prepaid/collect); Claim ↔ Penalty ↔ Force majeure ↔ Arbitration (CISG). Mode "Bắt lỗi hợp đồng": a draft contract with highlighted clauses; clicking one reveals the error (reuse Contract Clause Doctor data if it exists).

### C7 — Documents (no slide flow diagram)
**D7.1 `c7-document-lifecycle` · P2 · derived** — swimlane: who **issues** each document (seller: commercial invoice, packing list, pro forma; carrier: B/L / AWB; insurer: insurance certificate/policy; chamber/authority: C/O; government authority: phytosanitary; seller or independent inspector: inspection / quantity / quality certificates) → who **uses** it (buyer, customs, bank). Click a document → KB definition + checklist (invoice vs L/C 7 items, B/L 19 items, insurance 4 items).
**D7.2 `c7-bl-types` · P2 · derived** — decision tree: condition notation? (clean / unclean) · loaded? (shipped on board / received for shipment) · consignee? (to order – negotiable / straight – named consignee / bearer). Plus the 3 functions of the B/L.
**D7.3 Pro forma ⇄ Commercial invoice** — timeline (before sale/shipment vs actual shipment) built from the slide comparison table · P2.

### C8 — Procedures (highest value with C5)

**D8.1 `c8-export-procedure` · P1 · slide "Export procedures" (10 steps)** and **D8.2 `c8-import-procedure` · P1 · slide "Import procedures" (9 steps)** — exactly the step lists in KB §8.2 / §8.3 (including the slide notes: export licence not always required; transport & insurance depend on the rule; presenting documents depends on the payment method).
- **Scenario selectors** above the flow: Incoterms rule (11) + payment method (T/T advance, T/T deferred, D/P, D/A, L/C). Each step shows a state badge computed by a pure function:
  - *Người bán thực hiện* / *Người mua thực hiện* / *Không bắt buộc* / *Không áp dụng*.
  - Rules (from the slides): main transport booked by seller under **C & D**, by buyer under **E & F**; cargo insurance mandatory for the seller under **CIF & CIP**, buyer may insure under **E, F, CPT, CFR**; "Check L/C" (export step 2) and "Open L/C" (import step 2) active only when payment = L/C; export clearance by buyer under EXW (KB §3.8); import clearance by seller under DDP (KB §3.8); "Present shipping documents for payment" depends on the method (L/C, D/P, D/A → through banks; T/T → per contract).
- **Mirror view** (toggle "Xem song song"): export and import procedures side by side with connector lines between matching steps: contract ↔ contract · check L/C ↔ open L/C · transport (C & D) ↔ transport (E & F) · insurance (CIF & CIP) ↔ insurance (E, F, CPT, CFR) · export clearance ↔ import clearance · deliver ↔ take delivery · present documents ↔ make payment · claims ↔ claims. This shows students the two procedures are two sides of one contract.

---

## 5. MASTER: END-TO-END TRADE JOURNEY (`/journey`)

Purpose: one place where the student sees **the whole course as one transaction**.

### 5.1 Layout
- **Swimlanes (rows):** Seller · Seller's bank · Carrier / Forwarder · Export customs · Insurer · Import customs · Buyer's bank · Buyer.
- **Phases (columns), each tagged with its chapter:**
  1. Plan & quote (C1, C2, C3 pricing) · 2. Sign contract (C6) · 3. Set up payment (C5) · 4. Prepare & inspect goods (C8) · 5. Book transport & insure (C3, C4) · 6. Export clearance (C8) · 7. Delivery → **risk transfer** (C3) · 8. Main carriage (C3) · 9. Documents & payment (C5, C7) · 10. Import clearance & take delivery (C8) · 11. Inspect, claim, disputes (C6, C4).
- Three overlays the student can toggle: **Dòng hàng** (goods), **Dòng chứng từ** (documents), **Dòng tiền** (money) — same visual language as §3.4.

### 5.2 Controls
- Incoterms rule (11), payment method (T/T advance, T/T deferred, D/P, D/A, L/C at sight), transport mode (sea / air / road – sea-only rules disable air/road and explain why; air → AWB instead of B/L).
- "Play toàn bộ hành trình" + step-through; every card is clickable (same StepPanel) and links to the chapter section and practice topic.
- Markers on the goods lane: **⚑ điểm chuyển rủi ro** and **$ điểm chuyển chi phí** (two markers for C-rules).
- "Sự cố" mode reuses the D3.3 incident logic.

### 5.3 `buildJourney(rule, payment, mode)` — pure function, fully unit-tested
Must encode only KB facts:
- Who clears export (EXW → buyer, else seller); who clears import (DDP → seller, else buyer).
- Who books main carriage (C & D → seller; E & F → buyer); delivery/risk point per KB §3.8 (FAS alongside ship; FOB/CFR/CIF on board; FCA/CPT/CIP to the (first) carrier; DAP ready for unloading; DPU unloaded; DDP cleared for import, ready for unloading; EXW at disposal, not loaded).
- Insurance: CIF → seller, minimum ICC (C); CIP → seller, ICC (A); otherwise optional, by the party bearing the risk.
- Payment sequence: T/T advance → money before shipment; T/T deferred → goods before money; D/P → documents released against payment at collecting bank; D/A → documents released against acceptance, payment at maturity; L/C → buyer opens L/C before shipment, documents go seller → advising → issuing → buyer, bank pays against complying documents.
- Required tests (minimum): all 11 × 5 × valid-mode combinations build without error; EXW export clearance = buyer; DDP import clearance = seller; DPU is the only rule where the seller unloads; FOB/CFR/CIF risk point = on board at port of shipment; CPT/CIP risk point = first carrier; C-rules have two different markers; CIF insurance = ICC(C), CIP = ICC(A); FAS/FOB/CFR/CIF reject air/road; D/P releases documents after payment, D/A after acceptance; T/T advance money step precedes goods step; L/C "open L/C" precedes shipment.

---

## 6. CONTENT RULES FOR STEP PANELS

- `what`: 2–3 sentences, Vietnamese, concrete (who → does what → to whom → with which document/money).
- `why`: 1–2 sentences on the purpose or the risk it controls (from KB).
- `trap`: one real exam trap per step where the KB supports one (e.g. "Advising bank ≠ confirming bank", "D/A: người mua nhận chứng từ TRƯỚC khi trả tiền").
- `documents`: names exactly as in KB §7.
- `source`: KB section + slide chapter/page.
- No sentence may introduce a fact absent from the KB; `[EXT]` content only in `ext`.
- Write a script `npm run validate:diagrams` that fails if: Zod fails; an edge references a missing node; step `order` values are not 1..n without gaps (except explicit sub-steps like `5b`); a step lacks `what`/`why`/`source`; a `practiceTopic` is not in the topic list; a `slide` diagram has no `slideRef`.
- Step-count tests: D1.1 = 9, D1.2 = 9 + 5, D1.3 = 4, D3.3 strip = 10 points, D5.1 = 5, D5.2 = 5, D5.3 = 7 (+5b for D/A), D5.4 = 9, D5.5 = 11, D8.1 = 10, D8.2 = 9.

---

## 7. DESIGN

- Match the existing UI exactly (fonts, colors, spacing, components, dark mode). Diagrams should feel like the slides **redrawn cleanly**, not like a new app.
- Clean and quiet: no gradients, no clip-art bank buildings (use simple ellipses/rounded rects as on the slides), thin strokes, generous whitespace, labels never overlapping arrows.
- Canvas max height ~520px desktop; StepPanel 360px wide on the right; on mobile the panel is a bottom sheet.
- Legend always visible in a corner (flow kinds + actor colors).
- Performance: each diagram spec is a separate lazy chunk; the `/journey` page loads under 200 KB JS gzipped extra; Lighthouse ≥ 90 maintained.

---

## 8. TESTS & QUALITY

- Vitest: spec validation, step counts (§6), `buildJourney` (§5.3), incident logic (D3.3), procedure state badges (D8.1/D8.2), quiz scoring.
- Testing Library: clicking a step opens the panel; keyboard `→` advances; quiz drag order check works with keyboard.
- Manual QA checklist in the PR/commit description: every P1 diagram compared side by side with its slide (numbering, arrow direction, node positions).

---

## 9. PHASES & CHECKPOINTS

**Phase 0 — Audit (no code changes except KB amendments)**
- Read the current codebase. Report: existing routes, the Incoterms Explorer and Payment Flow Stepper implementation (what can be reused), theme tokens, store structure, theory markdown anchors where embeds will go.
- Apply the KB amendments in §2.
- ⏸ **CHECKPOINT 0:** send me the audit + a short plan of which existing components you will extend vs create.

**Phase 1 — Engine + pilot**
- Build the engine (§3) and ONE pilot diagram: **D5.4 `c5-lc-basic`** with Explore, Play, Order quiz, mobile list, a11y, progress.
- ⏸ **CHECKPOINT 1:** describe the pilot (layout, interactions) so I can test it on the deployed preview before you scale up.

**Phase 2 — C5 + C8 diagrams**
- D5.1, D5.2, D5.3, D5.5, D5.7, D8.1, D8.2 (incl. mirror view and scenario selectors). Embed in chapters; build `/diagrams` hub.
- ⏸ **CHECKPOINT 2.**

**Phase 3 — C1 + C3 diagrams**
- D1.1–D1.4, D3.1–D3.3 (Incoterms Explorer upgrade + incident simulator).
- ⏸ **CHECKPOINT 3.**

**Phase 4 — Master Journey**
- `/journey` with `buildJourney` + tests, overlays, markers, incident mode; dashboard button; "Xem trên sơ đồ" buttons from MCQ explanations (topic map).
- ⏸ **CHECKPOINT 4.**

**Phase 5 — Derived diagrams + polish**
- P2 diagrams (D2.1, D3.4, D4.1, D4.2, D5.6, D6.1, D7.1–D7.3), Actor and Gap quizzes everywhere, progress on dashboard, Lighthouse + a11y pass, README section "Cách thêm một sơ đồ mới" (how to add a new diagram spec).
- ⏸ **FINAL CHECKPOINT:** list every diagram with provenance, step count, quiz types and test status.

---

## 10. DEFINITION OF DONE

- [ ] KB amendments A1–A5 applied
- [ ] Diagram engine with Explore / Play / Order / Actor / Gap modes, mobile list, keyboard + screen-reader support
- [ ] All P1 diagrams: D1.1–D1.4, D3.1–D3.3, D5.1–D5.5, D5.7, D8.1–D8.2 — numbering verified against slides
- [ ] `/journey` master flow with rule × payment × mode reconfiguration and tested `buildJourney`
- [ ] Embedded in chapter pages at the right sections + `/diagrams` hub + dashboard progress
- [ ] "Xem trên sơ đồ" links from MCQ explanations
- [ ] P2 derived diagrams, clearly labelled as derived
- [ ] `validate:diagrams` passes; all tests pass; existing features unchanged; Lighthouse ≥ 90

If any slide diagram, KB text or this spec disagree, **stop and ask me** instead of choosing.
