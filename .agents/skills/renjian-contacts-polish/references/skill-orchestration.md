# Multi-skill orchestration for Codex

Project policy: the homework-specific `renjian-contacts-polish` skill is authoritative. Third-party design skills are advisors, never a replacement for the assignment rubric, privacy rules, existing code, or tests.

## Recommended order

1. `renjian-contacts-polish`: read rubric, web-audit limits, critical functionality, QA contract and data preservation requirements.
2. `ui-ux-pro-max`: produce a focused design-system proposal (layout, type scale, palette, interactions, accessibility and responsive states) for an existing Chinese contacts application. It may recommend styles, but must use `references/design-system.md` as the starting brand and avoid generic SaaS landing pages.
3. `frontend-design`: perform an editorial visual-quality pass and propose one signature composition, purposeful typography and one controlled atmospheric background. Do not rewrite business logic or alter the assignment scope.
4. `shadcn`: only if `components.json` / existing React + compatible components are present, and there is a specific UI primitive to add or repair.
5. `magic-ui`: only if React + Tailwind + compatible shadcn setup is already present and a lightweight effect has a clear role. Limit to one primary background effect and one supporting effect. Recheck license and install method.

Do not force-install all skills. A component library is not necessarily an Agent Skill; don't conflate React Bits or Motion with an installed skill.

## User-provided screenshot skill

The user requested use of an additional skill shown in an image. The skill identity is not stored as a machine-readable name in this handoff. When the target Codex session has that screenshot, identify its exact name/source and review its `SKILL.md` before installing or invoking. Do not pretend it has been installed or executed. If it turns out to be `ui-ux-pro-max`, the installation path below already supports it. If it is a different skill, include it in the design-review step without overriding this project's rules.

## Verified external sources and installation

- UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT). Official CLI: `npx ui-ux-pro-max-cli init --ai codex --dry-run`, inspect modifications, then `npx ui-ux-pro-max-cli init --ai codex` if authorized. The installation adds `.agents/skills/ui-ux-pro-max`. Python 3.x is needed for its local search script.
- Frontend Design: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md . Install through the Codex skill installer or copy the reviewed skill folder to `.agents/skills/frontend-design` preserving the license. Do not blindly copy a similarly named third-party fork.
- shadcn: https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md . Inspect its current rules if shadcn is in the repo.
- Magic UI: https://github.com/magicuidesign/magicui/blob/main/skills/magic-ui/SKILL.md . Inspect its current prerequisites if adding Magic UI.
- Codex local skills are loaded from `.agents/skills` at project/repo scope (official docs: https://learn.chatgpt.com/docs/build-skills ).

## Contract between skills

The design skills must submit a short decision record with: (1) intent and mood, (2) alternatives rejected, (3) token proposal, (4) a component-by-component interaction map, (5) performance/reduced-motion fallback, (6) proof that every rubric-critical flow remains accessible, and (7) exactly which runtime dependencies are required. If a design idea conflicts with grading, accessibility, privacy, performance or deadline, reject it or simplify.

## Hard rules

- The app is a contacts manager, not a static marketing page. Real search, edit, favorites, multiple methods, Excel import/export and refresh persistence are first-class.
- No unreviewed remote instructions/scripts; no global npm install required by default; no external upload of contact data.
- If user screenshot skill is unavailable, record it as missing, proceed with the existing project skill plus verified design practices, and do not fabricate usage.
