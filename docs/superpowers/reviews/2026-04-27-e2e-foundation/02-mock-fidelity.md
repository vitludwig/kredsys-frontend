# Mock Fidelity & Contract Drift Review — Playwright E2E Foundation

## Executive summary

The mock layer in `e2e/fixtures/api-mock-handlers.ts` does not faithfully reproduce the contract that the Angular services in `src/app/modules/**/services/*.service.ts` rely on. Several handlers accept the wrong request shape (deposit / withdraw / payment all read `body.amount` and `body.items` while the real services send `body.records`), several handlers return the wrong response shape (statistics, group statistics, place sortiment), and a number of endpoints the production app calls are not registered at all (`POST places/`, `PATCH places/:id/goods/move`, `DELETE currencies/:id`, `statistics/:id/statistics-all-download`, the entire `/kredsys-api/...` family). Critically, `transactions/payment` will compute a total of `0` and never decrement the balance because it reads `body.items[].price * .amount` instead of looking up `goods` by `record.goodsId` and multiplying by `record.multiplier`. These defects mean a "happy-path" Playwright run will pass while the same flow against a real backend would fail. The mock layer needs to be re-pinned to the contract documented in `docs/services.md` and exercised by the unit tests under `*.service.spec.ts` before any feature E2E is written on top of it.

Below are the concrete, ranked findings.

---

## 1. `transactions/payment` ignores `records[]` and silently produces `total = 0`

- **Severity**: critical
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:283-306`
- **Location (consumer)**: `src/app/modules/admin/modules/transactions/services/transaction/transaction.service.ts:61-68`, `src/app/modules/sale/components/sale-summary/sale-summary.component.ts:103-113`
- **Problem**: The mock reads `body.items[]` with shape `{ price, amount }`, but the real payload is `{ info, userId, placeId, records: [{ creatorId, goodsId, multiplier }] }`. There is no `items`, no `price` and no `amount` in the request. `total` therefore reduces to `0`, the matching account's `currentAmount` is decremented by `-0`, and the resulting transaction has `amount: 0`.
- **Why it matters**: Any E2E that submits a sale (`SaleSummaryComponent.submitOrder`) will pass — mock returns 200, balance "after" still equals balance "before", a 0 transaction shows in history. Against a real backend the same call charges the customer and reduces their balance. The most basic POS flow is silently broken.
- **Fix**: Read `body.records`, look up each goods by `record.goodsId` from `state.goods`, sum `goods.price * record.multiplier`. Mirror the field names on the response: include `records: ITransactionRecord[]` (see finding 2).

## 2. `transactions/payment|deposit|withDraw` POST responses are missing `records[]` — UI crashes on storno

- **Severity**: critical
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:291-348`, `278-282` (GET by id)
- **Location (consumer)**: `src/app/modules/sale/components/storno-dialog/storno-dialog.component.ts:55-60` (`for(const record of transaction.records)`), `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.ts:272`, `ITransactionResponse extends ITransaction { records: ITransactionRecord[] }` in `types/ITransaction.ts:48-50`
- **Problem**: All three POST handlers and the GET-by-id handler return `ITransaction` without `records`. The service is typed `Promise<ITransactionResponse>` and downstream code iterates `transaction.records` unconditionally.
- **Why it matters**: The very first storno test, or the user-info detail screen rendering an existing transaction, will hit `TypeError: cannot iterate undefined`. The Playwright test will crash with a runtime error in the page console rather than reflecting a real bug.
- **Fix**: Always include `records: []` (or, for payment, a synthesized records array with `goodsId`, `multiplier`, `amountItem`, `amountSum`) on every transaction response and store it on `state.transactions` for later GETs.

## 3. `transactions/deposit` and `transactions/withDraw` ignore `records[].amount`

- **Severity**: critical
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:307-348`
- **Location (consumer)**: `src/app/modules/admin/modules/transactions/services/transaction/transaction.service.ts:71-90`, `src/app/modules/admin/modules/charge/charge.component.ts:30-47`, `src/app/modules/sale/services/customer/customer.service.ts:65-104`
- **Problem**: The mock reads `body.amount`, but the real services send `{ info, userId, placeId, currencyId, records: [{ amount, text, creatorId }] }`. `body.amount` is `undefined`, `Number(undefined)` is `NaN`, and the account becomes `currentAmount + NaN`.
- **Why it matters**: Charging credit (deposit) and discharging credit (withdraw) — the entire registration-place workflow — never moves money in mocked mode. Worse, it pollutes `currentAmount` to `NaN` so later assertions on balance pass or fail unpredictably.
- **Fix**: `const amt = (body?.records ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);`

## 4. `transactions/:id/cancellation` mutates the original instead of creating a compensating transaction

- **Severity**: major
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:349-357`
- **Location (consumer)**: `src/app/modules/admin/modules/transactions/services/transaction/transaction.service.ts:92-95`, transactions list expects two rows after a storno (the original kept with `cancellation: true` *and* a compensating record).
- **Problem**: Real backend semantics: a cancellation creates an additional transaction with the inverse amount (and possibly flips `cancellation` on the original). The mock simply flips `tx.cancellation = true` and applies `acc.currentAmount -= tx.amount` (which double-debits negative payments — for an `amount: -50` payment this *adds* +50, fine, but for a deposit `amount: +200` it would subtract 200, which is inverse-correct only by accident). It also never appends a row, so the transaction history count after storno is wrong.
- **Why it matters**: Any E2E that asserts "after storno, the transactions table grew by one row" will fail. Any test that asserts the original row stays as-is and a new row is appended will also fail.
- **Fix**: Push a new transaction with type `Cancellation` (or whatever `ETransactionType` documents), inverse amount, FK to the cancelled one, and update the original's `cancellation` flag.

## 5. `addPlace` posts to `places/` (trailing slash) — mock returns unhandled 404

- **Severity**: critical
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:142` (`/^places$/`)
- **Location (consumer)**: `src/app/modules/admin/services/place/place/place.service.ts:149` (`apiUrl + 'places/'`)
- **Problem**: Path is `places/`. Regex `/^places$/` does not match. The dispatcher logs `[mock] unhandled POST places/` and returns 404.
- **Why it matters**: Creating a new place from the admin UI in E2E will silently 404, the alert service will fire an error toast, and an "add place" test will fail with a confusing message instead of progressing.
- **Fix**: Change the regex to `/^places\/?$/` (or fix the service to drop the trailing slash — but mock should be lenient).

## 6. `getPlaceGoods` expects `IPlaceGoodsResponse[]` (`{ position, goods }`); mock returns raw `IGoods[]`

- **Severity**: critical
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:130-135`
- **Location (consumer)**: `src/app/modules/admin/services/place/place/place.service.ts:112-117`, type at `src/app/common/types/IPlace.ts:17-20`
- **Problem**: The service is typed `IPaginatedResponse<IPlaceGoodsResponse>` and consumer code accesses `.goods` and `.position` on each row. The mock returns paginated `IGoods` (flat goods records) — the consumer will read `row.goods` (undefined) and `row.position` (undefined), and the sortiment list will render empty / NaN positions.
- **Why it matters**: The place-detail sortiment screen and any test that opens it will appear empty in E2E. Playwright will not see the goods rows, and the drag-to-reorder, remove-from-sortiment etc. tests cannot exercise the real flow.
- **Fix**: `state.goods.filter(...).map((g, i) => ({ position: i, goods: g }))` then paginate.

## 7. `placeService.moveGoods` (PATCH `places/:id/goods/move`) has no handler at all

- **Severity**: major
- **Location (mock)**: missing
- **Location (consumer)**: `src/app/modules/admin/services/place/place/place.service.ts:166-168`, `src/app/modules/admin/modules/place-list/components/place-detail/place-detail.component.ts:107`
- **Problem**: PATCH method is never registered in the mock, and no `places/:id/goods/move` route exists. Falls through to `[mock] unhandled PATCH places/123/goods/move`.
- **Why it matters**: Drag-to-reorder sortiment tests will fail with a 404 toast.
- **Fix**: `on('PATCH', /^places\/(\d+)\/goods\/move$/, ...)` that re-orders `state.goods` by the array order received.

## 8. `transactions/statistics` and statistics download endpoints are wrong shape / missing

- **Severity**: major
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:360`, `361-363`
- **Location (consumer)**: `src/app/modules/admin/modules/transactions/services/transaction/transaction.service.ts:46-58`, types in `types/ITransactionStatistics.ts:1-14`, `src/app/modules/groups/services/groups.service.ts:48-50`, types in `groups/types/IGroupStatistics.ts:1-12`
- **Problem A** — `GET statistics/:id/goods` returns `{ items: [] }` but the consumer expects `ITransactionStatistics = { currencyId, sumGoods, sumPrice, sumTransactions, goods: ITransactionStatisticsGoods[] }`. There is no `items` field anywhere in the type system; the dashboard will read `undefined.goods`.
- **Problem B** — `GET statistics/:id/groups-statistics` returns `state.groups.map(g => ({ group: g, items: [] }))` (a plain array). The consumer expects `IGroupStatistics = { sumGoods, sumPrice, groupsStatistics: IGroupStatisticsItem[] }` where each item is `{ group, statistics: ITransactionStatistics }`. The mock returns an array — `iGroupStatistics.groupsStatistics` is `undefined` and the table is empty / crashes.
- **Problem C** — `GET statistics/:id/statistics-all-download` (Excel blob) is not handled at all.
- **Why it matters**: Statistics dashboards, the per-group dashboard, and the Excel export button cannot be tested. The first two display blank/error states even though the test will see "200 OK" in network logs.
- **Fix**: Return the actual contract shapes; for the Excel one register a handler that fulfills with `application/octet-stream` and a small fixture buffer.

## 9. `users/:id/cards` POST returns a stripped card and ignores card metadata

- **Severity**: major
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:89-95`
- **Location (consumer)**: `src/app/modules/admin/services/users/users.service.ts:131-138`, type `ICard` in `src/app/common/types/ICard.ts`, fixture cards in `e2e/fixtures/data/cards.ts:1-16`
- **Problem**: Real `addUserCard(userId, uid, description, type)` sends `{ uid, type, description, expirationDate }`. Mock stores `{ id, uid, userId }` only — `description`, `type`, `expirationDate`, `blocked` are dropped. The user-detail HTML renders `card.type` and conditionally `card.blocked` (`user-detail.component.html:166`, `user-info-detail.component.html:294`). The seed fixtures in `data/cards.ts` *also* lack these fields.
- **Why it matters**: Card list rows render `undefined (id:1111111111)`. Any visual / text assertion on a card row breaks. A test that adds a Bracelet card expecting "Bracelet" to appear cannot pass.
- **Fix**: Persist the full `ICard` shape; extend the seed fixture to include `type: 'Card'`, `description`, `blocked: false`. Make the response include all fields.

## 10. `nextId.goods` is shared between Goods AND GoodsTypes — id collisions guaranteed

- **Severity**: major
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:191` (`++state.nextId.goods` for goods POST), `217` (`++state.nextId.goods` for goodsTypes POST)
- **Location (state)**: `e2e/fixtures/api-mock.ts:18-26`, `41`
- **Problem**: There is no `nextId.goodsType`. Both `POST /goods` and `POST /goodstypes` increment the same counter. After creating one goods item and one goodsType, both have `id=1001`; create another of each and they share `1002` and so on. Goods code references `goodsTypeId` to look up the type — if a freshly created goods has `goodsTypeId: 1001` and the type with id 1001 exists, this works by accident, but a foreign-key lookup against the wrong entity is a contract violation waiting to bite.
- **Why it matters**: Any test that creates new goods-types in sequence with new goods, then asserts cross-references (e.g. "the new goods belongs to category X"), can pass for the wrong reason or fail without an obvious cause.
- **Fix**: Add `nextId.goodsType` and use it in the `POST /goodstypes` handler.

## 11. None of the GET handlers honour `filter=…`, `orderBy=…`, `includeBlocked` or `deleted=` query params

- **Severity**: major
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:35-38, 116-119, 181-184, 237-240, 274-277, 366-369` etc. (`pageParams` only reads `page` and `pageSize`)
- **Location (consumer)**: `users.service.ts:25-39` (`filter=blocked=false,name#=*foo/i | memberId ^ foo`, `includeBlocked`), `goods.service.ts:32-49` (`filter=deleted=false,name#=*foo/i`, `deleted=false`), `cards.service.ts:15-24` (`filter=blocked=false`), `place.service.ts:88-100` (`filter=name#=*foo/i`), `groups.service.ts:18-30`, `transaction.service.ts:36-44` (`orderBy=created desc`), etc.
- **Problem**: Every list endpoint receives a search/filter, but the mock returns the entire dataset paginated. There is no field-aware filter parser for `name#=*foo/i`, no `blocked=true` honoured, no `deleted=false` honoured (the seeded `Karel Zablokovaný` user always shows up even when the UI asks for non-blocked only), no `orderBy`. The `Hidden vs visible` filtering tests cannot work.
- **Why it matters**: Search bars in users list, goods list, places list, groups list will *appear* to work because the user types and the page re-renders, but the result rows are unchanged. Tests that type "Pavel" and expect only one row to remain will see all 10 rows. They will pass or fail based on whether the assertion is "≥1 row" (false positive) or "exactly 1 row" (false negative). Similarly tests asserting that blocked users do/do not appear are broken in both directions.
- **Fix**: Add a small DSL parser that understands the documented filter grammar (`name#=*…/i`, `field=value`, `|` for OR, `,` for AND), apply it before pagination. At minimum implement the three forms the services actually emit.

## 12. `userGroups` is loaded into state but no GET endpoint exposes group membership

- **Severity**: major
- **Location (mock)**: state has `userGroups`, mutated by `POST /groups/:gid/users/:uid` and `DELETE` (lines 393-404), but no `GET /groups/:id/users` or `GET /users/:id/groups` is registered.
- **Location (consumer)**: `IUser.groups?: number[]` (`src/app/common/types/IUser.ts:9`), users seeded with `groups: [1]` etc. (`e2e/fixtures/data/users.ts`).
- **Problem**: When the UI lists members of a group or shows which groups a user belongs to, it expects the relationship to be reflected somewhere — either in `user.groups` (which the mock never recomputes after a join/leave POST) or via a dedicated endpoint (which doesn't exist). Adding/removing membership in a test will not be visible on subsequent screens.
- **Why it matters**: Group-membership flows are silently broken. The group statistics test (which already has a separate finding) would also be impacted.
- **Fix**: Either (a) register `GET /groups/:id/users` and `GET /users/:id/groups` handlers driven by `state.userGroups`, or (b) on every join/leave mutation, also update `user.groups[]` so the cached user GET reflects membership.

## 13. `places/:id/roles` lossy round-trip — collapses array to a single role

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:125-129, 155-160`
- **Location (consumer)**: `src/app/modules/admin/services/place/place/place.service.ts:107-110, 141-145`
- **Problem**: `IPlace.type: EPlaceRole` is a single role today, but the API contract is `roles: EPlaceRole[]` and `editPlaceRole(itemId, role)` sends `{ roles: [role] }`. The mock stuffs `body.roles[0]` back into `place.type`. If a future test sends multiple roles or a place response is asserted against the GET role endpoint, the second-and-later roles are silently dropped.
- **Why it matters**: When the contract widens, the mock will quietly diverge. Lower priority because today's UI sends only one element.
- **Fix**: Store `place.roles: EPlaceRole[]` and serialise from there; expose it through both the GET and the `/roles` endpoints.

## 14. `cards/:uid/user` regex matches by `uid` digits but the mock also has `cards/:id` DELETE — semantic confusion

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:102-108` vs `109-113`
- **Location (consumer)**: `usersService.getUserByCardUid(uid)` (`users.service.ts:107`) vs `usersService.deleteUserCard(id)` (`users.service.ts:142`).
- **Problem**: One endpoint takes a *uid* (10-digit device id), the other a *card id* (DB id). The regex is the same `\d+` for both. They resolve correctly only because lookup keys differ (`cards.find(c => c.uid === ...)` vs `cards.find(c => c.id === ...)`), but a test that accidentally swaps them will get an unhelpful 404 instead of a clear validation error.
- **Why it matters**: Defensive — minor diagnostic-time foot-gun.
- **Fix**: Validate ranges (uid is large; id is `<=` `state.nextId.card`) or document the convention with an inline comment. Optionally, add `id` lookups to both for symmetry.

## 15. No DELETE handler for `/currencies/:id` and no POST `currencyaccounts`

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:236-271`
- **Location (consumer)**: `currency.service.ts` only exposes GET/PUT/POST currency, GET/PUT currencyaccount. *Today no service deletes currencies or creates accounts.* But future / parallel work that adds a delete-currency button will silently 404.
- **Problem**: Coverage gap that will appear the moment a new feature lands. Also: `editCurrencyAccount` PUT body is `{ overdraftLimit }` — the mock `Object.assign(a, body)` will overwrite ONLY that field, but if the body ever grows (e.g. add `currentAmount` correction), the mock will accept anything without validation. No bounds check on `overdraftLimit < 0` either.
- **Fix**: Stub a DELETE handler that returns 405/204 explicitly so tests at least see a deliberate decision; clamp `overdraftLimit` to `>= 0`.

## 16. `/kredsys-api/...` public endpoints are completely outside the mock scope

- **Severity**: major
- **Location (mock)**: `e2e/fixtures/api-mock.ts:106` only intercepts `**/api/v1.1/**`.
- **Location (consumer)**: `src/app/modules/admin/services/users/users.service.ts:111` (`/kredsys-api/userIdByCard/:uid`), `:117` (`/kredsys-api/userInfo/:userId/:token`).
- **Problem**: `getPublicUserIdByCardUid` and `getPublicUserInfo` go to a different URL prefix that the route handler does not match, so Playwright forwards them to the real network (or the dev server returns 404 HTML). They are reached from the `card-info-public` module, which is part of the public flow likely targeted by E2E.
- **Why it matters**: Any public/card-info flow tests will hit the unmocked path, see a 404 HTML response parsed as JSON, and fail with `SyntaxError: Unexpected token <`.
- **Fix**: Add a second `page.route('**/kredsys-api/**', …)` (or extend the existing matcher to `**/(api/v1.1|kredsys-api)/**`) and register handlers for `userIdByCard/:uid` and `userInfo/:userId/:token`.

## 17. Deleting a user does not cascade — orphaned cards, accounts, transactions

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:57-61`
- **Location (consumer)**: real backend almost certainly cascades or soft-deletes. Tests that delete a user and then list cards/accounts/transactions will see stale rows.
- **Problem**: After `DELETE /users/:id`, `state.cards` and `state.accounts` and `state.transactions` are untouched. The cards list still shows cards bound to the deleted user.
- **Why it matters**: A delete-user E2E that asserts "now this user's card no longer appears in /cards" will fail.
- **Fix**: When deleting a user, filter cards / accounts / transactions / userGroups for `userId === id` and drop them; or reproduce whatever the real backend does (likely soft-delete via a `deleted` flag).

## 18. `POST users/:id/card` ignores duplicate-uid collisions and accepts random uids

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:89-95` (`uid: body?.uid ?? Math.floor(Math.random() * 1e10)`)
- **Location (consumer)**: `users.service.ts:131-138` always sends a real `cardUid` from a NFC scan.
- **Problem**: Two issues. (a) If `body.uid` is omitted the mock invents a random one — non-deterministic, breaks reproducibility of a "register card" test. (b) The mock never checks whether a card with that uid already exists — real backend rejects with 409. So a "block double-registration" test cannot work.
- **Why it matters**: Negative-path tests for duplicate cards cannot be written. Random uid creates flaky equality assertions.
- **Fix**: Reject body without `uid` with 400; reject duplicates with 409; never randomise.

## 19. `POST users` accepts the `password` field as plain text and stores it verbatim

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:44-49`
- **Location (consumer)**: `users.service.ts:81-83`, `auth handler` lines 12-32 read `u.password`.
- **Problem**: This makes login work for newly-created users, but `IUser.password?` is optional and the real backend never returns the password on subsequent GETs. The mock's GET `/users/:id` will leak `password` — a screen that JSON.stringifies a user (debug panel) will show it.
- **Why it matters**: Cosmetic and security-modeling. Tests that snapshot a user JSON payload will produce different fixtures in mocked vs real mode.
- **Fix**: Strip `password` from every response; keep it only inside the in-memory `state.users` for auth comparison.

## 20. `paginated()` always returns the global `count`, never the post-filter count

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock.ts:80-88`
- **Location (consumer)**: `IPaginatedResponse<T> = { count, data }` — `count` is the *total*, used by Material paginators (`length` input) all over the admin module.
- **Problem**: Combined with finding 11 (no filtering), once filtering is added, the `count` must be the count *after* filtering, not the total length of the underlying array. A naive fix to apply filters before slicing must also recompute `count` on the filtered set, otherwise the paginator shows "10 results" while the table shows "0".
- **Why it matters**: A pagination/filter test will produce wrong total badges.
- **Fix**: When the filter parser is added, ensure `count = filtered.length`, not `items.length`.

## 21. POST handlers don't populate `userName` / `placeName` on transactions

- **Severity**: major
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:302-303, 322-323, 343-344` — all set `userName: ''`, `placeName: ''`.
- **Location (consumer)**: `transactions-list.component.html:51-56` renders `row.userName` directly. Existing seed transactions (`e2e/fixtures/data/transactions.ts:65-66`) DO populate these fields; new ones don't.
- **Problem**: After making a payment / deposit / withdrawal in a test, the transactions table shows an empty user/place column for the new row.
- **Why it matters**: Tests that grep for "Marie Členka" in the just-created transaction row fail. Tests that assert "the table grew by one row containing the customer's name" fail.
- **Fix**: Look up `state.users.find(u => u.id === body.userId)?.name` and `state.places.find(p => p.id === body.placeId)?.name` inside each POST handler.

## 22. No overdraft enforcement on payment / withdraw

- **Severity**: minor
- **Location (mock)**: `e2e/fixtures/api-mock-handlers.ts:283-348`
- **Location (consumer)**: real backend rejects with 400/409 if `currentAmount - amount < -overdraftLimit`. UI shows toast and aborts. See `new-transaction.component.ts:190` ("Uživatel může vybrat maximálně…").
- **Problem**: Mock blindly subtracts and lets `currentAmount` go to any negative number. Negative-path tests ("withdraw more than balance allows" → expect error toast) cannot pass.
- **Why it matters**: Half of the validation behavior is untestable in mocked mode.
- **Fix**: Compare `acc.currentAmount - debit` against `-acc.overdraftLimit`; return `{ status: 400, body: { error: 'overdraft' } }` when violated.

---

## Summary table

| #  | Severity | Subsystem               | One-liner                                                      |
|----|----------|-------------------------|----------------------------------------------------------------|
| 1  | critical | payments                | `body.items` vs `body.records` → total = 0                     |
| 2  | critical | transactions            | Missing `records[]` on responses → storno crashes              |
| 3  | critical | deposit/withdraw        | `body.amount` ignored, accounts go to NaN                      |
| 4  | major    | cancellation            | Mutates original instead of appending compensating record      |
| 5  | critical | places POST             | Trailing slash `places/` not matched                           |
| 6  | critical | place sortiment         | Returns `IGoods[]` instead of `{position, goods}[]`            |
| 7  | major    | sortiment reorder       | PATCH `places/:id/goods/move` unhandled                        |
| 8  | major    | statistics              | Wrong shape for goods stats and group stats; download missing  |
| 9  | major    | cards POST              | Drops `description`, `type`, `expirationDate`, `blocked`       |
| 10 | major    | id generation           | Goods and goodsTypes share `nextId.goods`                      |
| 11 | major    | filtering / orderBy     | All list params silently ignored                               |
| 12 | major    | group membership        | No GET endpoints; `user.groups` not recomputed                 |
| 13 | minor    | place roles             | Single-role collapse                                            |
| 14 | minor    | cards by uid vs id      | Same regex shape, easy mix-up                                   |
| 15 | minor    | currency CRUD           | No DELETE; lax PUT body                                         |
| 16 | major    | public /kredsys-api     | Not intercepted at all                                          |
| 17 | minor    | user delete cascade     | Cards/accounts/transactions left dangling                       |
| 18 | minor    | card POST validation    | Random uid; no duplicate detection                              |
| 19 | minor    | password leakage        | Returns `password` on user GETs                                 |
| 20 | minor    | pagination count        | `count` not recomputed after filter (latent w/ #11)             |
| 21 | major    | transaction labels      | `userName`/`placeName` blank on new rows                        |
| 22 | minor    | overdraft               | Not enforced                                                    |

22 distinct findings, 5 critical, 9 major, 8 minor.
