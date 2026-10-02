# EIM Study Hub

A study website for the course **Export & Import Management (Quản trị Xuất Nhập khẩu)**, Assoc. Prof. Dr. Bùi Thanh Trang, UEH.

All content is based on `KNOWLEDGE_BASE.md` (the single source of truth). Questions and cases are in English; explanations and the UI are in Vietnamese, with English terms kept in parentheses.

| Feature | Route |
|---|---|
| Dashboard: progress per chapter, weak topics, exam history | `/` |
| Theory for C1–C8: key takeaways, traps, embedded tools, mini-check | `/learn/c1` … `/learn/c8` |
| MCQ practice with instant feedback (filters by chapter, topic, difficulty, not-done/wrong) | `/practice` |
| 12 fixed mock exams × 50 questions, plus a random blueprint exam (timer, autosave, results, review) | `/exams` |
| 38 case studies with model answers and self-grading rubrics | `/cases` |
| Wrong-answer bank (leaves after 2 correct in a row) and flagged questions | `/review` |
| Flashcards and EN–VI glossary | `/flashcards`, `/glossary` |
| Interactive tools: Incoterms® Explorer, ICC Coverage Checker, Payment Flow Stepper, L/C Date Checker, FX & Profit Calculator | `/tools` |
| Optional account (e-mail + password) that syncs study progress across devices | `/account` |

Progress, exam sessions/history and case drafts are always stored **in the browser** (localStorage keys `eim-progress`, `eim-exams`, `eim-cases`, `eim-settings`), so the site works without an account.

With Supabase configured (see [Accounts & sync](#accounts--sync-optional)), users can sign up and their progress is synced to their account and shared across devices. Without configuration, the account features are hidden and nothing is sent anywhere.

---

## Requirements

- **Node.js ≥ 20.11** (the scripts use `import.meta.dirname`), npm ≥ 10

## Getting started

```bash
npm i
npm run dev          # http://localhost:5173
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server. In dev, every data file is also validated with Zod when it loads. |
| `npm run build` | Production build into `dist/`. Runs `validate:bank` first (prebuild) and **fails if the bank or the cases are invalid**. |
| `npm run preview` | Serve the production build locally (http://localhost:4173). |
| `npm test` | Unit and integration tests (Vitest + Testing Library). |
| `npm run typecheck` | TypeScript strict check. |
| `npm run validate:bank` | Validate the 600 MCQs and the case studies (schema, duplicates, ERRATA rules, calculations, explanation lengths, blueprint counts, case targets). Add `-- --warnings` to list all warnings. |
| `npm run build:exams` | Rebuild `src/data/exams/exams.json` (12 exams × 50, blueprint 20/20/10, balanced answer letters). Deterministic: `-- --seed 20260101` (default). |
| `npm run report:bank` | Distribution report: difficulty per blueprint group, topics per chapter, calculation/extNote/errata counts. |
| `npm run review:bank -- --chapters C3 --sample 10 --out review/c03.md` | Export a readable sample of questions for proof-reading. |
| `npm run fixture:bank` | Generate a synthetic 600-question bank (for testing the scripts only). |

## Accounts & sync (optional)

Accounts use **Supabase** (free plan). The app works without it; set it up only if you want progress to follow users across devices.

1. **Create a project** at https://supabase.com (free plan).
2. **Create the table:** Dashboard → *SQL Editor* → New query → paste [`supabase/schema.sql`](supabase/schema.sql) → *Run*. This creates `user_progress` with row-level security, so each user can only read and write their own row.
3. **Auth URLs:** *Authentication → URL Configuration*:
   - *Site URL*: your production URL, e.g. `https://eim-study-hub.vercel.app`
   - *Redirect URLs*: add `https://eim-study-hub.vercel.app/account` and `http://localhost:5173/account`
4. **E-mail.** E-mail + password sign-in is enabled by default. Supabase's built-in e-mail sender is meant for testing only: it has a very low hourly limit and may only deliver to members of your Supabase organization. For a public site, choose one of:
   - **Set up custom SMTP** (*Authentication → Emails → SMTP Settings*). Any SMTP provider with a free tier works, for example a Gmail account with an app password, or a transactional e-mail service. This is needed for confirmation e-mails **and** password-reset e-mails.
   - Or **turn off “Confirm email”** (*Authentication → Sign In / Providers → Email*). Users can then sign up and use the site immediately, but password-reset e-mails still need working e-mail delivery.
5. **Keys:** *Project Settings → API*: copy the **Project URL** and the **anon public** key.
   - Local: copy `.env.example` to `.env.local` and fill in both values, then restart `npm run dev`.
   - Vercel: *Project → Settings → Environment Variables*: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Production and Preview), then redeploy.

Notes:

- The anon key is designed to be public; access to data is enforced by the row-level security policies in `schema.sql`. Never put the `service_role` key in the app.
- **What syncs:** practice stats, the wrong-answer bank, flags, learned sections, flashcard marks, exams in progress, exam history and case work. Theme and exam duration stay per device.
- **Merging:** progress made before signing in is merged into the account on the first sign-in. Data left on a shared computer by another account is never merged; there is also a “sign out and clear this device” option.
- **Free-plan limits:** a Supabase free project is **paused after about a week without any activity**. Restore it from the dashboard; the data is kept. Check Supabase's pricing page for current quotas.

## Deploying to Vercel

1. Push the repository to GitHub/GitLab and import it in Vercel. Alternatively, run `npx vercel` in the project folder.
2. Settings (Vercel normally auto-detects them):
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js version: 20.x or newer
3. `vercel.json` already rewrites every path to `index.html`, so deep links such as `/learn/c3#traps` or `/exams/EXAM-01` work on reload.
4. Optional: add the two Supabase environment variables (see [Accounts & sync](#accounts--sync-optional)) and redeploy.

Vercel's free *Hobby* plan is intended for personal, non-commercial projects, which fits a free study site.

Any other static host works the same way: serve `dist/` and send unknown paths to `index.html`.

---

## Adding or editing questions

Questions live in `src/data/questions/c01.json` … `c08.json`, one array per chapter. The schema is `src/schemas/mcq.ts`.

```jsonc
{
  "id": "C3-fob-005",                   // C<chapter>-<topic>-<nnn>, unique
  "chapter": "C3",
  "topic": "fob",                        // must be a topic id from src/config/chapters.ts
  "difficulty": 2,                       // 1 easy · 2 medium · 3 hard
  "cognitive": "apply",                  // remember | understand | apply | analyze
  "stem": "Under FOB … ?",               // English; write NOT / EXCEPT in capitals
  "options": [ { "id": "a", "text": "…" }, { "id": "b", "text": "…" }, { "id": "c", "text": "…" }, { "id": "d", "text": "…" } ],
  "correct": "c",                        // exactly one correct option
  "explanation": {
    "summary": "…",                      // Vietnamese, ≤ 40 words
    "whyCorrect": "…",                   // 40–120 words
    "whyWrong": { "a": "…", "b": "…", "d": "…" },   // 15–50 words each, one entry per wrong option
    "source": "KB §3.8 – FOB",           // KB section the answer relies on
    "trap": "…",                         // optional
    "extNote": "[EXT] …"                 // optional; required for (T) errata E-03, E-06, E-13
  },
  "tags": ["scenario"],                  // e.g. scenario, calculation, integrated, error-spotting, ext, errata-E06
  "calc": { "kind": "revenue", "inputs": { "quantity": 25, "price": 3200 }, "expected": 80000 }  // optional
}
```

Rules that the validator enforces (or warns about):

- **Content:** the answer must follow the KB. **(N)** errata (E-04, E-07, E-08, E-09, E-11) must never be the basis of a correct answer. **(T)** errata need the `extNote`.
- **Options:** no “All/None/Both of the above” (a ≤ 3% exception is allowed only with `"lockOrder": true`). NOT/EXCEPT stems are capped at 10%.
- **Calculations:** with a `calc` block, the result is recomputed and must appear in the correct option's text, and in no distractor. Kinds: `revenue`, `gross-profit`, `gross-margin`, `fx-value`, `fx-gain-loss`, `insured-amount`, `tolerance-min`, `tolerance-max`.
- **Blueprint:** the full bank must match the counts per blueprint group × difficulty (see `src/config/blueprint.ts`). If you add a question, remove (or re-level) another one in the same group and difficulty, or change the blueprint.

After editing:

```bash
npm run validate:bank -- --warnings
npm run build:exams        # only if the set of question ids changed
npm test
```

> `build:exams` reassigns questions to exams. Previously saved exam attempts keep their own copy of the question ids and answers, so history stays reviewable.

## Adding or editing case studies

Cases are in `src/data/cases/cases.json` (schema: `src/schemas/case.ts`).

- **ID:** `CASE-C5-03`. The prefix must match the **first** chapter in `chapters`. A case with ≥ 3 chapters counts as *integrated*.
- **Content:** `scenario` and `modelAnswers` are English markdown (tables allowed); `rubric` criteria and `commonMistakes` are Vietnamese.
- **Points:** task points must sum to **10**, and each task's rubric criteria must sum to that task's points. Split big criteria into several checkboxes so self-grading can give partial credit.
- **Minimums:** ≥ 3 tasks and ≥ 3 common mistakes per case. Per-chapter targets: C1 2 · C2 4 · C3 8 · C4 5 · C5 8 · C6 5 · C7 4 · C8 2, plus ≥ 6 integrated cases.

`npm run validate:bank` checks all of this.

## Editing theory

Theory is in `src/content/theory/c01.md` … `c08.md`:

- `## Title {#section-id}` starts a section; the id is used for the table of contents and deep links.
- `> [!TAKEAWAYS]`, `> [!TRAP] Title`, `> [!NOTE]`, `> [!EXT] Title`, `> [!ERRATA] Title` create callouts.
- `::embed[incoterms]` embeds a tool or visual (see `src/features/learn/embeds.tsx`).

`src/features/learn/theory.test.ts` checks that every list and table in the KB still appears in the theory.

---

## Project structure

```
src/
  config/        chapters & topics, exam blueprint, errata
  schemas/       Zod schemas (MCQ, exam, case, glossary)
  data/          questions/*.json, exams/exams.json, cases/cases.json, glossary, flashcards, lazy loaders
  content/       theory markdown (c01–c08)
  features/      dashboard, learn, practice, exam, cases, review, tools
  lib/           pure logic (exam scoring/random exam, progress, calc, bank validation/build) + tests
  lib/sync/      cloud sync: merge rules, sync engine, Supabase adapter
  store/         zustand stores (progress, exams, cases, settings, auth) persisted to localStorage
supabase/        schema.sql for the optional accounts & sync backend
  components/    layout and UI kit
scripts/         validate-bank, build-exams, bank-report, export-review, gen-fixture-bank
review/          proof-reading exports produced during content generation
```

**Stack:** Vite 6, React 18, TypeScript (strict), Tailwind CSS v4, React Router 6, Zustand, Zod, react-markdown, Recharts, Supabase (optional), Vitest.

**Quality:**
- Lighthouse (mobile profile, production build) scores 95–99 for performance and 100 for accessibility and best practices on the main pages.
- Dark mode follows the system and has a manual toggle.
- The app is fully keyboard-usable: A–D / 1–4 to answer, Enter for the next question, F to flag.
