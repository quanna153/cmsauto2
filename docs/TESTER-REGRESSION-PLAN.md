# Tester Regression Plan

## Summary

Run three rounds after BE/FE fixes land:

1. BE API regression.
2. FE visual and flow regression.
3. Full integration UAT.

Each round must record command output, API smoke status, screenshots, bugs by severity, and retest status. Do not include API keys, cookies, `.env.local`, SQLite files, `.next`, `dist`, or screenshot artifacts in commits.

## BE API Regression

Environment:

- Use Node 24 and pnpm 10.
- `apps/api/.env.local` must contain Gemini, Tavily, and Semrush values when live provider smoke is required.
- Do not print credentials in logs.
- Backup or reset `apps/api/data/cmsauto.sqlite` before destructive full regression.

Commands:

```bash
pnpm handoff:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node scripts/api-regression-smoke.mjs
```

Use `LIVE_PROVIDER_SMOKE=1 node scripts/api-regression-smoke.mjs` when the tester must call live Semrush, Tavily, and Gemini providers.

Required API coverage:

- Auth/session: login, me, logout, invalid password, missing cookie.
- Users: list, create, update, reset password, revoke sessions, delete, admin access control.
- Articles: manual publish, schedule, list, autosave with `expectedRevision`, stale revision conflict 409.
- Factory articles: save an in-progress Factory session, update the same saved session, finish it into editor-ready state, then schedule it through review gate.
- Public reader: list, detail by slug, `/api/public/articles/search` locale/query/pagination.
- Keyword: suggest, refresh volume, provider fallback without crashing.
- Factory AI: brief, outline, draft schema validity.
- Article images: `/api/article-images/generate` returns mock `planned` image without key; real provider returns `generated` image with `url` or `base64`; missing key/proxy has a clear error and no secret leakage.
- Internal links: XLSX import, list/filter, suggest, apply accepted-only, reject unknown URL.
- Market proxy: `/api/public/markets/tickers` returns price/change/cache/fallback shape.

Expected BE result:

- API health returns `ok: true`; Gemini/Semrush configured when env is present.
- Provider failures return a clear fallback or error; no secret appears in response or logs.
- Public contracts stay stable unless a task explicitly changes them.

## FE Visual And Flow Regression

Commands:

```bash
pnpm test:e2e
node scripts/fe-visual-audit.mjs
```

Screenshot viewports:

- Desktop: 1440 x 1000.
- Tablet: 834 x 1112.
- Mobile: 390 x 844.

Routes:

- Reader: `/vi-vn`, `/en-us`, `/vi-vn/markets`, `/vi-vn/knowledge`, `/vi-vn/analysis`, `/vi-vn/articles`, `/vi-vn/search`, one long article detail.
- Admin: `/admin/dashboard`, `/admin/articles`, `/admin/articles/new`, `/admin/factory`, `/admin/keyword-research`, `/admin/internal-links`, `/admin/users`.

Required FE coverage:

- Reader header mobile menu opens/closes and does not occupy the first viewport by default.
- Market widgets load through backend proxy; no browser Binance CORS errors.
- Article detail has one TOC, readable Inter/system font, and no overlapping sidebar/related content.
- Keyword research accepts seed/language, shows loading/error/empty/result states.
- Internal links import reports created/updated/skipped, and list search/filter/pagination works.
- Article Factory shows explicit long-running loading messages for Semrush, Tavily/Gemini, draft, and internal-link matching.
- Article Factory image panel creates a mock image plan after draft, previews provider output when configured, and keeps `draft.generatedImages` after save/resume.
- Article Factory in-progress work can be saved to `/admin/articles`, reopened with `Tiếp tục tạo`, and updated without creating duplicate records.
- Factory-generated articles can be opened in the editor, reviewed, scheduled, and listed as `scheduled`.
- Admin articles mobile actions stay visible.

Expected FE result:

- No horizontal overflow at desktop/tablet/mobile widths.
- No text overflows buttons, cards, inputs, or table cells.
- No duplicate TOC.
- No severe console errors on primary routes.
- Reader uses CoinRadar green/neutral style; admin uses CMS navy/gold utilitarian style.

## UAT Gate

Report template:

```md
# UAT Report

## Commands
- [ ] pnpm handoff:check
- [ ] pnpm lint
- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] pnpm build
- [ ] pnpm test:e2e
- [ ] node scripts/api-regression-smoke.mjs
- [ ] node scripts/fe-visual-audit.mjs

## API Smoke Summary
- Health:
- Auth/users:
- Articles:
- Reader search/detail:
- Keyword/providers:
- Internal links:
- Market proxy:

## FE Screenshot Summary
- Screenshot folder:
- Desktop issues:
- Tablet issues:
- Mobile issues:

## Bugs
### Blocker
### High
### Medium
### Low

## Retest
- Bug ID:
- Status:
- Evidence:
```

Release condition:

- No Blocker or High bugs remain.
- `pnpm handoff:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e` passes.
- Main flows work end-to-end: admin login, keyword research, article image generation mock/provider, internal link import/suggest/apply, manual article publish, reader search/detail, and market chart.
- Factory work is not lost when interrupted: save in-progress, resume, finish, and schedule publish all pass.

## Latest Retest Notes

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` passed on 2026-06-09.
- Live FE smoke passed for Factory save/resume/schedule:
  - Save in-progress after keyword step.
  - Show saved item in `/admin/articles` with `Tiếp tục tạo`.
  - Resume Factory from `?articleId=...`.
  - Generate brief, outline, draft, and internal link suggestions.
  - Save ready article back to the same record.
  - Open editor and schedule publish; result status `scheduled`.
- Evidence screenshot: `/tmp/cmsauto-scheduled-editor-ui.png`.
- Environment caveat: repo now declares Node `>=24` at root, API, and Web package level, but the current machine runtime used for retest was `/usr/bin/node v22.22.1`, so pnpm printed engine warnings.
