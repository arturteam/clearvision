# BOGO local review — 2026-11-22

## Changes
- EN form: /bogo/; PL form: /pl/bogo/.
- Home-page links prepared in hidden containers marked data-bogo-launch-link. Email claim/support flow stays visible. Reveal links only after service readiness is confirmed.
- Both forms remain noindex/nofollow. Localized navigation, privacy links, images and language alternatives checked.
- Recovery token is cryptographically generated and persisted/read back before fetch. The same purchase and browser storage retain the token across retries/reloads, including a different gift selection. Never clear storage while recovery is needed.
- Inputs are locked during requests. Invalid order IDs, blocked storage, HTTP errors, malformed responses, unknown errors and expired Turnstile tokens have safe handling. A failed retry hides the previous result.
- Mobile CSS includes narrow-screen spacing, stacked gift choices and flexible navigation.
- No giveaway source/config changes. No backend changes, production POSTs, real orders, real coupons or secrets used.

## Verification
- tests/bogo.test.cjs: PASS for EN and PL using Node VM with mocked DOM, storage, Turnstile and fetch; no external requests.
- Covers claim/replay with DEMO-ONLY, persisted recovery across reload, gift change, fresh request IDs, duplicate-submit lock, validation, blocked storage, HTTP/network/JSON failures and all documented error messages.
- Static HTML checks: local assets/navigation/privacy/language targets exist; three gift options per form; UTF-8; noindex/nofollow; prepared home links hidden.
- git diff --check: PASS.
- Run repeatable logic tests from repository root with: node tests/bogo.test.cjs

## Manual checks and activation prerequisites
- Visual browser/mobile review and real Turnstile loading were NOT verified: browser access host unavailable in this session. Suggested widths: 320, 360, 390, 768 and desktop. Check consent banner, three images, keyboard focus, navigation PL/EN, verification widget and no horizontal overflow.
- Production claim/recovery end-to-end was NOT run. Use a separate backend/registry with DEMO coupons; do not bypass the production test-mode block.
- Keep BOGO_ENABLED and BOGO_READY disabled.
- Confirm both historical coupons are excluded from AVAILABLE pool (ISSUED/WITHDRAWN).
- Confirm Google Play API access for CV06 and CV08; CV08 qualifies only after launch.
- Reveal home-page form links only after readiness; keep mail as support.

Review prepared before the authorized commit/push. Backend activation is outside this change.
