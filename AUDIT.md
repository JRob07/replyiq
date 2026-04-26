# Career Minded — Premium Rebuild & Differentiation Audit

**For:** Claude Code, working in the existing `career-minded/` repo.
**Source of audit:** Direct read of the codebase as it exists today (38 source files reviewed).
**Strategy:** Reposition the product around three differentiators, fix the infrastructure gaps that are blocking premium feel, then upgrade UI in priority order.

---

## SECTION 0 — POSITIONING & WHAT WE'RE NOT BUILDING

### What Career Minded is NOT

We are not building another Scoir, Handshake, or Niche. The codebase as it currently stands trends in that direction — a clean directory of opportunities with a college profile feature. That's the category baseline. We're walking away from it.

### What Career Minded IS — three differentiators

These three drive every design, copy, and feature decision below. If a screen doesn't reinforce at least one of them, it's wrong.

**1. Every path equal — college, trade, apprenticeship, direct-to-job, military.**
Competitors lead with college and treat alternatives as a side menu. We lead with paths and let students compare them on the same screen, with the same data fields, side by side. The student doesn't choose a category before they choose a path; they see all paths and the math behind each.

**2. Outcome transparency — lead with what life looks like 5 and 10 years out.**
Competitors lead with photos of happy students, acceptance rates, and dorm reviews. We lead with median earnings by major (federal College Scorecard data is free), debt at graduation, completion rate, employment rate in field of study. A student can see "graduates of this school with this major earn a median of $X 10 years in, with $Y typical debt" before they see anything else. This is the kind of data colleges partnered with our competitors won't let them surface.

**3. AI-native, not AI-bolted-on.**
Generic chatbots are coming to every competitor in the next 18 months. We skip them. Instead: AI that decodes a financial aid letter into plain English, AI that drafts a scholarship essay tailored to the student's profile, AI that simulates a trade-apprenticeship interview. Each is a discrete, valuable tool — not a chat interface.

### Felt tone, not a feature

The product's primary user is a student without a guidance counselor. The voice should feel like a smart older sibling: warm, plainspoken, no jargon, no aspirational marketing fluff. When in doubt, default to less polished and more direct. "Your projected debt at this school" beats "Unlock your future." This shows up everywhere: button copy, empty-state language, tooltips, error messages.

### Visual references (use these, not the original "LinkedIn + Salesforce" framing)

- **Marketing & public pages:** Linear (linear.app), Stripe homepage, Scoir for category-appropriate density.
- **Dashboards (student & org):** Linear, Stripe Dashboard, Vercel Dashboard. NOT Salesforce Lightning.
- **Empty states & onboarding:** Notion is the gold standard.
- **Information density on data screens:** Stripe Dashboard.

---

## SECTION 1 — INFRASTRUCTURE AUDIT

These are real issues found in the current codebase. Fix them before any UI work.

### 1.1 Direct service injection — Firebase swap will be painful

**Where:** `src/app/features/public/components/opportunity-directory.component.ts:64`, `src/app/features/public/pages/college-profile/college-profile.component.ts:142`, `src/app/shared/layouts/public-layout/public-layout.component.ts:4`, every component that uses a service.

**Issue:** Components inject `MockAuthService`, `MockOpportunityService`, `MockCollegeService` directly. When Firebase is wired, every one of those imports has to change.

**Fix:**
- Create `src/app/core/interfaces/auth-service.interface.ts`, `opportunity-service.interface.ts`, `college-service.interface.ts` defining the contracts.
- Create `src/app/core/tokens/service.tokens.ts` exporting `AUTH_SERVICE`, `OPPORTUNITY_SERVICE`, `COLLEGE_SERVICE` `InjectionToken`s.
- Mock services `implements` the interfaces.
- In `app.config.ts`, provide each token using the mock implementation, with a clearly commented `// TODO(firebase):` block showing exactly what swaps when `environment.useMockServices` is `false`.
- Refactor every component to `inject(AUTH_SERVICE)` etc. — never import a concrete class.

### 1.2 `app.config.ts` is missing critical providers

**Where:** `src/app/app.config.ts`

**Issue:** Only has `provideRouter` with hash location. No animations, no Ionic providers despite Ionic being in `package.json`, no `withComponentInputBinding`, no token wiring.

**Fix:** Replace with:
```ts
provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }))
provideAnimationsAsync()
provideIonicAngular({ mode: 'md' })
// + all three service token providers with TODO(firebase): block
```

Also, drop `withHashLocation()` — use HTML5 routing. Hash routing breaks the routes-as-marketing-URLs pattern (`/scholarships`, `/colleges/cincinnati-state` should be clean URLs you can put on a flyer).

### 1.3 No 300–600ms artificial delay on services — skeletons will flash invisibly

**Where:** `mock-opportunity.service.ts:38, 42, 48` use 250ms, 150ms, 200ms. `mock-auth.service.ts:25` uses 600ms. Inconsistent.

**Fix:** Standardize all mock service methods to a randomized 300–600ms delay using a helper `mockLatency()` that returns `Math.floor(300 + Math.random() * 300)`. This is load-bearing for skeleton states being visible.

### 1.4 No toast system anywhere

**Where:** Nothing. Save actions have no feedback. Login errors get `throwError` with no UI handling.

**Fix:** Build `src/app/shared/ui/toast/`:
- `ToastService` — signal-based queue, `success/error/info/warning` methods.
- `ToastHostComponent` — bottom-right desktop, bottom-center on mobile (≤640px), 4s auto-dismiss, manual close button, smooth slide-in/fade-out.
- Mount once in `AppComponent` template.

### 1.5 No skeleton or error states anywhere

**Where:** `college-profile.component.ts:100` has a single emoji loading template. `opportunity-directory.component.ts` shows nothing during load. Failed service calls have no UI handling.

**Fix:**
- `src/app/shared/ui/skeleton/cm-skeleton.component.ts` with variants `line | card | avatar | circle`, using a shimmer animation defined in `global.scss`.
- `src/app/shared/ui/error-state/cm-error-state.component.ts` — icon + message + "Try Again" button emitting a retry event.
- Add the shimmer keyframes to `global.scss` if not present.

### 1.6 No save-button component despite saved-items in the data model

**Where:** `mock-opportunity.service.ts:51-58` has saved-item methods that nothing in the UI calls. `opportunity-directory.component.ts:24` renders cards with no save UI.

**Fix:** Build `src/app/shared/ui/save-button/cm-save-button.component.ts` — heart icon button, toggles via `OPPORTUNITY_SERVICE.toggleSave`. If unauthenticated, calls `ToastService.info('Sign up to save — it's free')` and routes to `/auth/register?returnUrl=<currentRoute>` on click.

### 1.7 `currentUser$` initialization bug

**Where:** `mock-auth.service.ts:15` — `currentUser$` is a separate `BehaviorSubject` that's only updated inside `tap()` callbacks alongside `authState`. Risk of drift.

**Fix:** Derive `currentUser$` from `authState$` via `.pipe(map(s => s.user))`. Single source of truth. Also persist auth state in `localStorage` so a page refresh doesn't log the student out — currently it does, which makes the demo feel broken.

### 1.8 Models missing the fields the differentiators require

**Where:** `src/app/core/models/college.model.ts:30-49`

**Issue:** No outcomes data on `College`. The whole "outcome transparency" pitch needs a place to live.

**Fix:** Add to `College`:
```ts
outcomes?: {
  medianEarnings5yr?: number;        // USD
  medianEarnings10yr?: number;       // USD
  completionRate?: number;           // 0-1
  employmentRateInField?: number;    // 0-1
  medianDebtAtGraduation?: number;   // USD
  monthlyLoanPayment?: number;       // USD, 10-year repayment estimate
  defaultRate?: number;              // 0-1, 3-year cohort
  source?: string;                   // 'College Scorecard 2024' etc
  asOf?: string;                     // ISO date
};
byMajor?: Array<{
  majorName: string;
  cipCode?: string;
  medianEarnings5yr: number;
  medianEarnings10yr: number;
  graduateCount: number;
}>;
```

Also create a new model file `src/app/core/models/path.model.ts`:
```ts
export type PathKind = 'four_year' | 'two_year' | 'trade' | 'apprenticeship' | 'direct_job' | 'military';

export interface Path {
  id: string;
  kind: PathKind;
  title: string;            // e.g. "Bachelor's in Mechanical Engineering at UC"
  providerName: string;     // college / employer / union / branch
  durationMonths: number;
  upfrontCostUsd: number;   // tuition + fees, net of typical aid
  typicalDebtUsd: number;
  startingSalaryUsd: number;
  fiveYrMedianUsd: number;
  tenYrMedianUsd: number;
  breakEvenMonths: number;  // months until total earnings - upfront cost > $0
  source: string;
  notes?: string;
}
```

This `Path` model is the spine of differentiator #1. Every path-comparison UI reads from it.

### 1.9 Type-narrowing antipatterns

**Where:** `college-profile.component.ts:35,36,48,49,61,62` use `$any(prog)`, `$any(s)`, `$any(e)` to bypass the discriminated union.

**Fix:** Pull each section into its own typed sub-component (`<cm-program-list-item [program]="prog">`, etc.) so the type narrows naturally inside the child component. Cleaner template, no `$any`.

### 1.10 No guards file matches the actual routes

**Where:** `src/app/core/guards/auth.guards.ts` exists but routing in `app.routes.ts:42,49` only protects two routes. No `publicOnlyGuard` on auth pages, so a logged-in user can re-visit `/auth/login`.

**Fix:** Add `publicOnlyGuard` to `auth/login`, `auth/register`, `auth/register-org`. Logged-in students hitting those routes redirect to `/dashboard`; org staff to `/org-dashboard`. Implement `returnUrl` query param so unauth visitors to guarded routes land back where they intended after login.

### 1.11 No accessibility primitives

**Where:** Across all components.

**Issue:** No focus-visible styles defined globally. Icon-only buttons (heart icons, mobile menu toggle at `public-layout.component.ts:36`) have no `aria-label`. Color contrast on `--cm-gray-400` (#B0B7C3) on white fails WCAG AA for body text. No reduced-motion handling despite heavy use of animations.

**Fix:**
- Add `:focus-visible` styles to `global.scss` that show a `--cm-shadow-focus` ring on every tabbable element.
- Add `aria-label` to every icon-only button.
- Replace `--cm-gray-400` for body text with `--cm-gray-500` minimum.
- Add `@media (prefers-reduced-motion: reduce)` block in `global.scss` that flattens all animations.

### 1.12 `useHashLocation` and `redirectTo: 'auth/welcome'` create a weird default URL

**Where:** `app.routes.ts:27, 56`

**Issue:** Visitors hitting `/` get redirected to `/auth/welcome` — but they're not authenticating, they're landing. This is a subtle but real positioning tell that says "we think of you as a user-to-be-acquired, not a student exploring." The marketing-page URL should be the root.

**Fix:** Move the welcome component to `/`. Rename routes:
- `/` — landing (was `/auth/welcome`)
- `/login`, `/sign-up`, `/sign-up/college` — auth (was `/auth/login`, etc.)

Cleaner URLs, better SEO, and the URL itself stops sounding institutional.

---

## SECTION 2 — DIFFERENTIATION-LED FEATURE BUILDS

These are the new things that make Career Minded different from Scoir/Handshake/Niche. Each is built as a discrete unit with its own component file(s).

### 2.1 The Path Comparator (Differentiator #1: Every path equal)

**The single most important component in the product.** This is what someone screenshots and shares.

**Location:** `src/app/features/public/components/path-comparator/path-comparator.component.ts`

**What it shows:** 2–4 paths side by side as columns. Each column has identical fields in identical positions: title, provider, duration, upfront cost, typical debt, starting salary, 5-yr median, 10-yr median, break-even point.

**Hero variant:** Lives on the landing page as the centerpiece (replacing the generic "Discover scholarships..." stat block). Hardcoded with a punchy comparison: "4-year degree at UC: Computer Science" vs "HVAC apprenticeship through Cincinnati State." Numbers pulled from real data, sourced. Two columns, no controls — just the comparison. A small "Compare other paths →" CTA at the bottom links to the full tool.

**Tool variant:** Lives at `/compare`. Student picks 2–4 paths from a typeahead. Shows the comparison with a "share" button (copies URL with paths encoded). Includes a horizontal "earnings over time" line chart per path so you can see the crossover point visually. No charting library needed — render with SVG, ~80 lines of code.

**Visual polish:**
- The "winner" cell in each row gets a subtle highlight (lighter background + green checkmark) when the value is favorable. Lower upfront cost = better. Higher 10-yr median = better. Shorter break-even = better.
- The break-even row has a small inline bar chart showing months-to-break-even relative to the longest in the comparison.
- All currency formatted with `Intl.NumberFormat`, no decimals on dollar amounts.

**Tone:** No editorial commentary. Just data and sources. The comparison speaks for itself; that's the entire point.

### 2.2 The Outcomes Panel (Differentiator #2: Outcome transparency)

**Location:** `src/app/features/public/pages/college-profile/components/outcomes-panel.component.ts`

**Currently the college profile leads with `Mission`, then `About`, then programs.** Demote those. The new top section, immediately after the profile header, is the Outcomes Panel. Six tiles in a 3×2 grid (or single column on mobile):

1. **Median earnings 10 years after enrollment** — big number, primary color. Subtitle: "$X — vs. national median of $Y."
2. **Completion rate** — percentage with a horizontal progress bar. Subtitle: "X out of 10 students who start here finish."
3. **Median debt at graduation** — big number. Subtitle: "$X. Monthly payment ≈ $Y on a 10-year plan."
4. **Employment rate in field** — percentage. Subtitle: "X% are employed in their field within 6 months of graduating."
5. **Default rate (3-yr cohort)** — percentage. Subtitle: "X% of borrowers default within 3 years."
6. **By major comparison** — small heat-map showing top 5 majors at the school with their 10-yr median. Click to expand to full list.

Every tile has a tiny "Source: College Scorecard 2024" link in the corner. **This sourcing is the credibility weapon — without it the numbers feel made up.**

If `college.outcomes` is missing, show a single tile that says "This college hasn't published outcomes data yet. We're working on it." rather than hiding the section. The absence is itself information.

**Mock data:** Seed all 3 colleges in the mock service with realistic outcomes data pulled from College Scorecard. (UC, Cincinnati State, NKU all have public Scorecard data.)

### 2.3 The Financial Aid Letter Decoder (Differentiator #3: AI-native)

**Location:** `src/app/features/student/pages/aid-decoder/aid-decoder.component.ts` + route `/dashboard/aid-decoder`

**What it does:** Student pastes a financial aid letter (most are PDFs, but plain text paste is the MVP). The component sends it to an LLM with a strict prompt that:

1. Identifies the school name and award year.
2. Extracts every line item: grants, scholarships (free money), subsidized loans, unsubsidized loans (debt), work-study, parent loans.
3. Computes the *real* cost: total cost of attendance minus free money only, separating out what the student actually has to pay or borrow.
4. Flags deceptive framing: any "award" that's actually a loan, anything called a "scholarship" that requires repayment, work-study counted as aid (it's earned wages, not aid), gapping where the family is expected to cover more than disclosed.
5. Outputs a side-by-side table: "What the letter says you got" vs "What you'll actually pay."

**Why this matters:** Financial aid letters are notoriously deceptive. There's no consumer-facing tool that does this well. The Department of Education tried to mandate a standardized format and it didn't stick. Students and parents misread these letters constantly and pick the wrong school.

**Implementation:**
- For the MVP, use the Anthropic API in-artifact pattern (the system prompt has the full code). Component sends the pasted text + a strict system prompt to Claude Sonnet 4 and parses the JSON response into the comparison table.
- Add a clear "AI-generated, double-check with your school" disclaimer.
- Save decoded letters to the user's saved-items so they can compare across schools.
- The output table is the comparable, screenshottable artifact — same as the path comparator.

**Stretch goal (not MVP):** PDF upload + text extraction client-side using PDF.js. Skip for first pass.

### 2.4 Plain-English Glossary as inline tooltips

**Location:** `src/app/shared/ui/jargon-tooltip/cm-jargon-tooltip.component.ts`

**Why:** Every place we use a jargon term — FAFSA, EFC, SAI, COA, subsidized, unsubsidized, Pell, work-study, gapping, GPA-required, accreditation, articulation, dual enrollment, prevailing wage, journeyman — wrap it in `<cm-jargon term="FAFSA">FAFSA</cm-jargon>`. The component shows a `?` next to the term. Hover or tap reveals a one-sentence plain-English definition.

**Implementation:** Single component with a hardcoded glossary keyed by term. Maybe 30 entries to start. Add as you discover jargon in the codebase.

This is small but it's the felt expression of the "smart older sibling" tone. No competitor does this consistently. Students notice.

### 2.5 The "What now?" panel on every empty state

**Location:** Replace generic empty states across the app.

**Current:** `student-overview.component.ts:19` shows "No saved items yet. Browse opportunities and save the ones you're interested in." That's the bar.

**New:** Empty states are personalized next-steps, not apologies. The saved-items empty state for a student becomes:

> **You haven't saved anything yet — that's fine.** Most students start one of these three ways:
> - **Compare two paths.** Pick a college and a trade, see the math. → [Open the comparator]
> - **Decode a financial aid letter.** Paste one and we'll show you what you'd actually pay. → [Open the decoder]
> - **Find scholarships near you.** Cincinnati has $X in local scholarships open right now. → [Browse Cincinnati scholarships]

Tone is direct, options are real, every link goes somewhere. **This is the Notion empty-state school of thought.** Apply to every empty state in the dashboard, the saved view, the org dashboard.

---

## SECTION 3 — UI UPGRADES (PRIORITY ORDER)

Ordered so each session can ship independently.

### Session A — Foundation fixes (everything in Section 1)

Do all 12 of the Section 1 fixes in one session. None of them are big individually; together they're the foundation everything else stands on.

**Done when:**
- Every component injects via tokens.
- `app.config.ts` has all four providers (router, animations, ionic, services).
- Mock services use 300–600ms randomized delays.
- Toast system works app-wide.
- Skeleton + error state components exist in `shared/ui/`.
- Save button works (saves when authed, prompts when not).
- Auth state persists across page refresh.
- Models updated with `outcomes`, `byMajor`, and new `Path` model.
- All `$any(...)` casts removed.
- All routes have correct guards including `publicOnlyGuard`.
- Focus rings, aria-labels, contrast fixes, reduced-motion in place.
- URLs are clean (no `/auth/welcome`, no hash routing).
- `ng build` passes clean.

### Session B — Path Comparator (Section 2.1)

Build the hero variant on the landing page first, then the full tool at `/compare`. The hero variant shipping first means even if the tool isn't done, the homepage is already differentiated.

**Done when:**
- Landing page has the comparator front and center, replacing the generic "Discover scholarships..." subtitle and stat block. The comparator IS the hero.
- `/compare` route works end-to-end with typeahead, share URL, SVG line chart of earnings over time.
- Mock seed data includes at least 8 paths covering all 6 `PathKind` values.
- Every number has a source link.

### Session C — Outcomes Panel on the College Profile (Section 2.2)

Replace the Mission / About / Programs ordering. New order:

1. Profile header (existing).
2. **Outcomes Panel** (new — top of page).
3. Programs (existing, but move "By Major" outcomes data into it inline — each program shows its own median earnings tile).
4. Scholarships.
5. Events.
6. About / Mission (demoted to bottom).
7. Quick Facts sidebar (existing).
8. **NEW: "Compare this school to..." CTA** that opens the Path Comparator pre-populated with this college vs a trade alternative in the same field.

**Done when:**
- All 3 mock colleges have realistic outcomes data sourced from College Scorecard.
- Outcomes Panel renders correctly when data is present and shows the "not yet published" tile when missing.
- The "Compare this school" CTA wires to the comparator.
- Mobile layout collapses the 3×2 to single column without overflow.

### Session D — Financial Aid Letter Decoder (Section 2.3)

This is the AI-native flagship. It needs to be polished or it'll feel gimmicky.

**Done when:**
- Student can paste a financial aid letter, hit "Decode," and see the comparison table within ~5 seconds.
- The output table is screenshottable, with school name, real cost, free money, debt taken, and flagged deceptive items.
- Multiple letters can be decoded and saved per student, then compared side by side (this is the kicker — paste two schools' letters, see them next to each other).
- AI disclaimer is present and non-dismissable.
- Prompt to Claude is strict and has been tested against real (anonymized) aid letters.

### Session E — Empty states + jargon tooltips (Sections 2.4, 2.5)

Sweep every empty state in the app and rewrite per Section 2.5. Add jargon tooltips around every glossary term encountered. Keep this session scoped to copy + small components — no big new pages.

**Done when:**
- Every empty state has 3 specific, real next-step CTAs.
- `<cm-jargon>` component is used in at least 15 places.
- Glossary file has at least 30 entries.

### Session F — Landing page rebuild beyond the comparator

The comparator handles the hero. But the rest of the landing page is still generic. Rebuild the lower sections:

- **Section: "Three things every other site won't tell you."** Three cards, each pointing at one of the differentiators with a concrete example. ("Most college guides won't show you median earnings — we lead with them. [Outcomes example for UC]")
- **Section: Featured comparisons.** 3–4 path comparisons curated by the team, each rendered as a small comparator card. Click to open in the full tool.
- **Section: For colleges (existing, demoted).** Keep the "register your college" CTA but move it lower. The product isn't selling to colleges first.
- **Section: Footer.** Existing is fine, add an "About the data" link to a `/methodology` page that explains where outcomes data comes from. Methodology pages are massive trust signals.

**Done when:**
- Generic stat blocks ("500+ Opportunities, 50+ Colleges") are gone. Concrete examples replace them.
- Every section reinforces a differentiator.
- A new visitor can scroll the page and grasp the three differentiators in 30 seconds without reading a paragraph.

### Session G — Directory pages upgrade (Priority 1B equivalent)

The current directories are OK but not premium. Upgrade per:

- Sort dropdown (newest, A-Z, region).
- Grid/list toggle.
- Skeleton loading states on first load (will work once Session A landed the 300–600ms delay).
- Color-coded category accent on each card's left border.
- Save button on every card.
- Result count in the header ("Showing 17 scholarships across Ohio").
- Empty state per Section 2.5 standards.

Do all 5 directories (scholarships, trades, internships, jobs, apprenticeships) and the colleges directory in one session — they share the directory component, so most work is in one file.

**Done when:** All 6 directories have sort, view toggle, skeletons, save, accent borders, result counts, premium empty states.

### Session H — Student dashboard upgrade

Currently `student-overview.component.ts` is a welcome banner + 6 quick-action tiles + an empty saved-items state. That's a placeholder, not a dashboard.

New dashboard structure:

1. **Top row: "Your numbers."** Three stat tiles: items saved, paths compared, profile completion %. Each is a clickable shortcut.
2. **"Pick up where you left off."** Last 3 things the student touched — a saved scholarship, a path comparison, a college viewed — with one-click resume.
3. **"Recommended for you."** 3–4 opportunity cards. Mock recommendation logic: pick from saved categories + region. (Real ML can come later.)
4. **"Activity."** Mock timeline of recent actions.
5. **"Your AI tools."** Two cards: "Decode an aid letter" and "Draft a scholarship essay" (essay drafter is a future build but the card can exist with "Coming soon").

Sidebar (left, on desktop): nav with Overview, Saved, Compare, AI Tools, Settings, Profile.

**Done when:** Dashboard feels like a personal home, not a category menu. Activity feed has mock data. Recommendations work against mock data. Mobile collapses sidebar to bottom tabs.

### Session I — Org dashboard upgrade

Currently `org-overview.component.ts` exists but I haven't read it. Audit it in this session and apply the same treatment as the student dashboard, but for an institutional user:

- Top row stats: profile views (mock chart), saved-by-students count, listings published.
- A profile-preview card that shows the live public-facing version of the college's page in a phone-frame mockup.
- Listing CRUD: create / edit / delete with type-specific forms (program / scholarship / event), confirmation dialogs.
- Publish/unpublish toggle.
- The Outcomes Panel data entry form lives here — let colleges enter their own outcomes data (it'll be reviewed against Scorecard data, but giving them a self-serve path is important).

**Done when:** Org staff can manage their entire profile and listings without leaving the dashboard. Publish toggle is explicit and confirmed.

### Session J — Responsive + accessibility audit pass

After everything is built, do a sweep at 375px, 768px, 1280px+. Fix overflow, broken layouts, sidebar-to-bottom-tabs collapse, table-to-horizontal-scroll on data screens. Run keyboard-only navigation through every primary flow. Confirm every icon-only button has aria-label.

Also: add `prefers-color-scheme` dark variants of every CSS variable. Don't ship dark mode UI yet — just have the tokens ready. Dark mode will be Session K if time permits.

### Session K (optional) — Dark mode

If Sessions A–J landed clean, dark mode is straightforward because the tokens are in place. Add a theme toggle to the user menu, persist in `localStorage`, default to `prefers-color-scheme`. This is genuinely premium — Linear and Vercel set this expectation.

### Session L — Methodology page + about + for-colleges

The boring but trust-building pages:

- `/methodology` — explains where outcomes data comes from, how Scorecard is sourced, refresh cadence, limitations. Citations to data.ed.gov.
- `/about` — mission statement (the "every path equal" framing), short team bio.
- `/for-colleges` — separate marketing page selling colleges on the platform. The pitch is honest: "We surface federal data whether you partner with us or not. Partnering lets you add context, programs, scholarships, events."
- `/privacy`, `/terms` — placeholder content with proper structure.
- `/404` — branded.

---

## SECTION 4 — HOW TO RUN THIS WITH CLAUDE CODE

The original brief said "build the entire platform" in one prompt. That's the wrong shape for a build this big. Use these sessions instead — one Claude Code session per Session A through L.

### Session 0 — Read-and-summarize (one-time)

Before any code is written, paste this:

> Read these files in order and don't write any code: `src/global.scss`, `src/theme/variables.scss`, `src/app/app.config.ts`, `src/app/app.routes.ts`, every file under `src/app/core/models/`, every file under `src/app/core/services/`, every file under `src/app/shared/`, then one representative file from each feature folder (`features/auth/pages/welcome/welcome.component.ts`, `features/public/components/opportunity-directory.component.ts`, `features/public/pages/college-profile/college-profile.component.ts`, `features/student/pages/dashboard/student-overview.component.ts`).
>
> Then summarize back to me, in 12 bullets:
> 1. The design tokens already in place.
> 2. The utility classes already in place (`.cm-card`, `.cm-btn`, etc.).
> 3. The route structure.
> 4. Where service injection happens (and whether it goes through tokens).
> 5. Whether there's a toast system.
> 6. Whether there's skeleton loading.
> 7. Whether there's an error-state component.
> 8. Whether `app.config.ts` has animations and Ionic providers.
> 9. The fields on `College` and whether they include outcomes data.
> 10. Whether there's a `Path` model.
> 11. Whether `mock-*.service.ts` files use consistent latency.
> 12. Anything that looks like it'll fight the upgrades described in `AUDIT.md`.
>
> When you're done, ask me which session to run first. **Don't write any code yet.**

This session anchors Claude Code's mental model in the actual codebase, not its assumptions. Skip it and you'll spend the next session correcting hallucinations.

### Session A through L — driving template

For each session, paste this template, replacing the bracketed parts:

> We're working on the `career-minded` Angular project. The full audit and rebuild plan is in `AUDIT.md` at the repo root — read it before doing anything if you haven't already.
>
> Today we're running **[Session X — name]**, which corresponds to **[Audit section ref]** in `AUDIT.md`.
>
> Before writing code:
> 1. Run `git log --oneline -20` to see what's already committed.
> 2. Re-read `src/global.scss`, `src/theme/variables.scss`, and `AUDIT.md` Section [X].
> 3. Read the existing files you'll be touching this session.
>
> Then build only what's in scope for Session [X]. Use existing design tokens — don't redefine colors, spacing, radius, shadow. Lean on `.cm-card`, `.cm-btn`, `.cm-badge` etc. instead of writing custom equivalents.
>
> The "Done when" criteria in `AUDIT.md` are the acceptance bar. After building, run `ng build` and fix all errors before committing. Use conventional-commits messages.
>
> When the session is done, run through "Done when" and tell me which boxes pass and which don't, and stop. Don't move to the next session.

### Quality-check prompts to use whenever needed

Anti-token-bypass:

> Run `grep -rn "#1976D2\|#FF6F00\|#E5E7EB\|padding: [0-9]\+px\|margin: [0-9]\+px" src/app --include="*.ts" --include="*.scss"` and show me every match. Every hit outside `src/global.scss` and `src/theme/variables.scss` is a bug — a hardcoded color or spacing value that should be a CSS variable. Fix all of them.

Anti-direct-injection:

> Run `grep -rn "MockAuthService\|MockOpportunityService\|MockCollegeService" src/app/features src/app/shared` and show me every match. Every one of these is a refactor target — components should `inject(AUTH_SERVICE)` etc. via tokens, never the concrete class.

Anti-generic-design:

> Look at the page you just built. Compare it screen-side to linear.app's marketing site, stripe.com, and vercel.com. List 5 specific places where what you built feels less polished than those references and fix them.

Anti-positioning-drift:

> The product has three differentiators: (1) every path equal, (2) outcome transparency, (3) AI-native. Look at the page/component you just built and tell me which differentiator it reinforces. If "none," explain why it should exist at all.

### Friction signs and recovery

If Claude Code starts producing output that doesn't match the audit:

- "I'll create a new color token" — push back, tokens already exist in `theme/variables.scss`.
- "I'll add the package X" — push back unless it's `@angular/fire` or a charting library you've explicitly approved.
- "I'll create a Mock service" — push back, mock services already exist in `core/services/`. Edit, don't recreate.
- Generic Bootstrap-y design — show the comparison-to-references prompt above.
- Drift toward Scoir/Handshake patterns — show the positioning-drift prompt above.

If a session goes badly: `git reset --hard HEAD~1` and start that session fresh in a new Claude Code session. Don't try to recover a confused session.

---

## SECTION 5 — ONE LAST POSITIONING NOTE

The current product copy throughout the codebase is aspirational marketing language: "Connect to Real Opportunities," "Your Future Starts Here," "Showcase Your Institution," "Build Your Path." This is the same voice every competitor uses. It's not wrong, but it's not differentiating.

The new voice is plainspoken and slightly skeptical of college-as-default. Examples of replacements you'll make as you go:

- "Connect to Real Opportunities" → "See the real cost and real outcomes of every path."
- "Your career journey starts here" → "Compare college, trade, and apprenticeship paths with real numbers."
- "Discover scholarships, trades, internships, jobs, apprenticeships, and colleges — all in one place." → "$120K of college debt or a $52K starting trade salary? See the math, then choose."
- "Showcase Your Institution" → "Add your college's story to the federal outcomes data we already publish."
- Welcome banner: "Welcome back, Jordan! Your career journey starts here." → "Welcome back, Jordan. Pick up where you left off."

When in doubt, write the version a tired student would actually read, not the version that wins a marketing committee.

---

End of audit. Save this file as `AUDIT.md` at the repo root. Reference it in every Claude Code session.
