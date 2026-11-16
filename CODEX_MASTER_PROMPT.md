# Copy into Codex: master implementation prompt

You are implementing a careful, assignment-compliant frontend refinement of my EXISTING Chinese contacts app, "Renjian Youxin / Contact Book". The deployed reference is:
https://renjian-youxin-contacts.flaredmerit8.chatgpt.site/
The primary assignment specification is:
https://bbs.csdn.net/topics/620593436

Read `AGENTS.md` and explicitly use `$renjian-contacts-polish` from `.agents/skills/renjian-contacts-polish/` FIRST. Read the rubric, website-audit, Excel-contract, design-system, motion-spec, acceptance-tests, and skill-orchestration references. The teacher's actual assignment, source code and observed behavior take precedence over generic Skill advice. The deadline is 2026-11-17 23:59, course timezone to be verified.

If `$ui-ux-pro-max` is installed, use it for a concise, app-specific design-system analysis (not a generic SaaS redesign). If `$frontend-design` is installed, use it to critique and refine visual identity. If another UI Skill was shown to me in a screenshot, identify its exact name from the screenshot/installed list, review its source, and use it for the same design-review stage when available. Use `$shadcn` and `$magic-ui` ONLY if the existing source stack is compatible; do not make a framework migration for component effects.

## Absolute rubric obligations

- Favorites / bookmark contacts: 25 pts. Add/remove star, favorites view, correct counts, persist after reload.
- Multiple contact methods: 10 pts. A person can have multiple phone numbers, emails and other labeled methods. Editing must retain all values.
- Excel import/export: 25 pts. Export each person on ONE row and each kind/item of information in an appropriate column. Correctly formatted Excel import must work. Roundtrip multiple phones/emails, favorite, notes, company and address without data loss.
- Page styling: 10 pts. High-quality polished responsive frontend, not just visual decoration.
- Blog / engineering material: 30 pts. Correct Markdown, real GitHub/repository/code-standard links, actual screenshots and video, implementation ideas, team distribution if relevant, commit evidence, individual PSP table.
- Optional cloud deployment: +15 pts according to teacher rule. Do not promise an arbitrary static URL qualifies as an eligible cloud-server deployment.
- Require >= 3 meaningful Git commits and authentic release + PR, as requested in the assignment; do not invent or push without permission.

## Primary design vision

Design a warm, high-end editorial contacts book, "Paper & Presence": paper ivory background, deep ink-green typography, sage accents, a small coral favorite-state accent, thin dividers, generous white space, restrained shadows and impeccable text hierarchy. Retain the existing product brand and its gentle Chinese voice, including the slogan. This is a functional app, not a hero-only portfolio or fintech dashboard.

The result should FEEL animated everywhere interactions matter, while remaining quiet and useful at rest:
- Hero: one subtle localized moving ambient paper/grid/glow layer (12-24 second slow loop) with static fallback, no pointer interception.
- Entry: short 250-450ms fade + tiny y shift, avoiding long forced waits.
- Favorite toggle: spring-like 220-300ms icon response + immediately correct semantic state, total count and filtered list.
- Contact rows/cards: delicate hover/focus transitions; 2-3px maximum lift; do not animate hundreds of list items at once.
- Search/filter: brief responsive 120-200ms list-state transition. Handle Chinese IME composition and rapid typing without stale results.
- Details/edit: accessible desktop side-sheet / mobile full-height sheet with 260-380ms enter/exit and proper focus management.
- Add/remove contact methods: 180-280ms row motion, appropriate labels and validation.
- Import/export: clear file selector/preview, progress or busy state, imported/skipped/error counts, inline errors, success feedback and preserved data.
- Empty / loading / error / search-empty / favorites-empty states must all be distinct, actionable and tasteful.

Animate opacity and transform preferentially. Respect `prefers-reduced-motion`, keyboard navigation, high text contrast, touch and 320/390/768/1440px widths. Avoid multiple simultaneous full-screen blur/WebGL/canvas backgrounds, scroll hijacking, endless text animations and flashy gradients. Long lists (200+ contacts) must remain responsive. Keep accessibility, content and interactions functional with motion disabled.

## Required execution sequence

PHASE 0 / Source audit (do not skip):
1. Inspect git status, project files, package manager, framework/version, routing, CSS, dependency footprint, contact model, persistence and Excel implementation. Never touch real contacts just to inspect them.
2. If available, run the bundled `repo_probe.py` on repo root. Probe reports structure only and is not a full audit.
3. Run the existing build/lint/tests if they exist, record actual results. Write `docs/audit-before.md`: known behavior, unknowns, active defects, risk register, file-level plan and screenshot strategy.
4. Determine whether current project is React, Vue or vanilla JS. Existing architecture stays. Produce a short design decision record before coding.

PHASE 1 / Lock essential behavior:
5. Create automated tests where practical, with synthetic contacts (never real personal data): A with 2 phones, 2 emails, 1 social account, 1 address, favorite true and company/notes; B with a different name and no favorite.
6. Validate favorites state, search, edit/delete, refresh persistence and Excel columns, roundtrip, duplicates and corrupted files. Repair failures BEFORE proceeding to decoration.
7. Protect Excel phone numbers from numeric coercion/leading-zero loss and exported values from formula injection. Establish a documented duplicate strategy and non-destructive import.

PHASE 2 / Design system and layout:
8. Define tokens and component states, reusing existing dependencies when possible. See bundled `assets/tokens.example.css` as an example only. Put design rationale in `docs/design-decisions.md`.
9. Prioritize existing header/nav, hero, stats, search toolbar, contact list, detail/edit form, import/export and relevant empty states. Ensure 0, 1-5 and 200+ contact states are all usable.
10. Improve typography, whitespace, focus and responsive design. Prioritize the brand and action clarity; reduce hero height on mobile and keep the contact list accessible above excessive decoration.

PHASE 3 / Purposeful motion:
11. Implement most UX motion with existing CSS and framework tools. If React already exists and Motion is suitable, use it as ONE unified animation engine. If React + Tailwind/shadcn already exist, selectively add at most one Magic UI background effect and one supporting micro-effect, after checking license.
12. Add reduced-motion fallbacks, backdrop click-through safety, focus restoration and keyboard handling. Effects must clean up timers/listeners/canvas resources on unmount.
13. Prefer predictable, maintainable code over demo effect imports. Do NOT add all React Bits / Magic UI / shadcn projects; source licenses and bundle sizes must be inspected first. React Bits' license includes Commons Clause.

PHASE 4 / Verify and hand off:
14. Run tests and browser QA against F01-F13 and U01-U08 in the bundled acceptance matrix. Create `docs/qa-results.md`, with Pass / Fail / Not Run, reproducible steps and concrete evidence. Never report a test run you did not perform.
15. Capture real screenshots (or document missing capture tooling) at desktop and 390px mobile: empty list, 3+ contacts, favorites, detail with multiple contact methods, import preview/success, accessibility/reduced-motion, plus 200+ long list.
16. Produce `docs/third-party-licenses.md` listing only actually installed/imported packages and components with source URLs, licenses and versions.
17. Write `docs/handoff-after.md` with changed files, commands run, before/after differences, remaining defects, rollout/backup notes and exact next actions to finish homework blog/PR/release/video. Prepare a demo script using synthetic data and a blog Markdown outline plus PSP template. No fictional evidence.

## Interaction detail acceptance

Every important clickable element must have correct hover, keyboard focus, pressed, disabled, loading and error treatment as appropriate. No control may depend on a moving background. All route and filter transitions must preserve the user's intended focus and scrolling behavior. Text truncation must not hide permanently unavailable contact information. Chinese and long addresses/emails should wrap appropriately. Touch targets should be about 44x44px for common mobile actions.

## Delivery format after actual work

Provide: (A) files changed + purpose, (B) rubric compliance matrix, (C) build/lint/test commands and actual results, (D) screenshots/video evidence paths, (E) installed dependencies/licenses, (F) failures/unverified areas, (G) safe steps for user-controlled Git commits, release, PR, blog and cloud deployment. Prioritize a functioning project over claiming visual completeness.

Start now with PHASE 0. Proceed through the phases as far as feasible in this session. If anything is unavailable, keep moving on verified tasks and record the limitation instead of inventing it.
