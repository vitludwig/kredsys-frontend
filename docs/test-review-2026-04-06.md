# Test Review - 2026-04-06

Review provedlo 5 nezavislych agentu, kazdy z jineho uhlu. Celkem nalezeno **61 issues**.

---

## 1. CORRECTNESS (12 issues)

### C1: CustomerService testy pouzivaji setTimeout(50ms) misto fakeAsync [CRITICAL]
- **Soubor**: `customer.service.spec.ts` radky 84, 104, 116, 129, 139
- **Popis**: Setter `customer` je async (vola `loadCurrencyAccount`), ale testy cekaji pomoci `await new Promise(resolve => setTimeout(resolve, 50))`. Toto je race condition - 50ms muze byt prilis kratke.
- **Dopad**: Flaky testy v CI, false positives.
- **Fix**: Pouzit `fakeAsync`/`tick`/`flushMicrotasks`, nebo refaktorovat setter aby vracel Promise.

### C2: CustomerService.logout test ma race condition [CRITICAL]
- **Soubor**: `customer.service.spec.ts` radky 102-111
- **Popis**: `logout()` nastavi `this.customer = null` coz triggeruje async setter. Aserce muze probehnout pred dokoncenim async operaci.
- **Fix**: Stejne jako C1.

### C3: chargeMoney pouziva `jasmine.any(Number)` misto konkretniho currencyId [MEDIUM]
- **Soubor**: `customer.service.spec.ts` radky 113-124
- **Popis**: Test neoveruje spravne currencyId (melo by byt `1` z mockAccount).
- **Fix**: Nahradit `jasmine.any(Number)` za `1`.

### C4: dischargeMoney pouziva `jasmine.any(Number)` pro currencyId [MEDIUM]
- **Soubor**: `customer.service.spec.ts` radky 126-136
- **Fix**: Stejne jako C3.

### C5: AlertService.error() test nechyta bug s double-spread `...config` [HIGH]
- **Soubor**: `alert.service.ts` radky 23-28, `alert.service.spec.ts`
- **Popis**: Zdrojovy kod ma `{...config, panelClass: 'mdc-snackbar--danger', ...config}` - druhy spread prepise panelClass. Test toto nechyta.
- **Fix**: Pridat test s custom `{panelClass: 'custom'}` config + opravit source bug.

### C6: AuthInterceptor test kodifikuje bug - posila expirovaný token [HIGH]
- **Soubor**: `auth.interceptor.spec.ts` radek 83
- **Popis**: Expirovaný token je stale poslan v Authorization headeru. Test toto chování schvaluje, ale je to pravdepodobne bug.
- **Fix**: Test by mel overit ze expirovaný token NENI poslan. Opravit interceptor.

### C7: AuthInterceptor neoveruje redirect na login pri expiraci [MEDIUM]
- **Soubor**: `auth.interceptor.spec.ts`
- **Popis**: Router je injektovan ale nikdy pouzit pro navigaci pri expiraci.
- **Fix**: Pridat test/implementaci redirectu na login.

### C8: PlaceGuard test neoveruje ze selectedPlace setter je opravdu zavolan [MEDIUM]
- **Soubor**: `place.guard.spec.ts` radky 40-48
- **Fix**: Pridat `expect(mockPlaceService.selectedPlace).toEqual(mockPlace)`.

### C9: GroupsService Observable testy - aserce v subscribe se nemusi provest [HIGH]
- **Soubor**: `groups.service.spec.ts` radky 40-51, 70-109
- **Popis**: Aserce uvnitr `.subscribe()` se tichy preskoci pokud Observable nikdy neemitne. Jasmine defaultne nepadne na nula asercich.
- **Fix**: Pridat `done()` callback pattern nebo flag promennou.

### C10: AuthService.init() neoveruje inicializaci isLogged$ [MEDIUM]
- **Soubor**: `auth.service.spec.ts`
- **Fix**: Pridat `expect(service.isLogged$).toBeDefined()` po `init()`.

### C11: AuthService `Number(...) ?? null` je latentni bug [HIGH]
- **Soubor**: `auth.service.ts` radek 47
- **Popis**: `Number(null)` vraci `0`, ne `null`. Operator `??` se nikdy neuplatni. Chybi negativni test.
- **Fix**: Pridat test pro `init()` bez userId v localStorage, s `'abc'`, s `'0'`.

### C12: SaleService spec je prazdny - nulove pokryti [MEDIUM]
- **Soubor**: `sale.service.spec.ts`
- **Fix**: Pridat testy nebo explicitni TODO.

---

## 2. COVERAGE GAPS (15 issues)

### G1: Cache decorator nema zadne dedickovane testy [CRITICAL]
- **Soubor**: `common/decorators/cache.ts` (156 radku)
- **Popis**: Cely caching framework (concurrent queuing, expiry, tag invalidation, error propagation) je kompletne bez testu. Pouziva se v kazde sluzbe.
- **Fix**: Napsat dedickovane testy pro `createCacher`: cache hit/miss, expiry, invalidation, concurrent calls, error rejection.

### G2: CustomerService error paths pro financni operace [CRITICAL]
- **Soubor**: `customer.service.ts` radky 62, 83, 104
- **Popis**: `chargeMoney`, `dischargeMoney`, `stornoLastTransaction` maji `catch(e) { throw e }` - zadny test neoveruje propagaci chyb.
- **Fix**: Testovat reject scenare - spy returning rejected promise.

### G3: CustomerService null safety kdyz customer/currencyAccount je null [HIGH]
- **Soubor**: `customer.service.ts` radky 70, 88
- **Popis**: Non-null assertions (`!`) skryvaji runtime crashe.
- **Fix**: Testovat volani chargeMoney/dischargeMoney bez nastaveného customera.

### G4: CustomerService.transformUserName je volana ale vysledek zahozen [HIGH]
- **Soubor**: `customer.service.ts` radek 22
- **Popis**: `this.transformUserName(customer?.name ?? '')` je volana v pipe ale jeji return value se nepouziva. Pravdepodobne bug.
- **Fix**: Opravit source (pouzit return value) + napsat test.

### G5: CurrencyService.getDefaultCurrency nema zadny test [HIGH]
- **Soubor**: `currency.service.ts` radky 41-47
- **Popis**: Pristupuje k `.data[0]` - pokud je list prazdny, nastavi `undefined`. Taky `getDefaultCurrency$()` neni testovano.
- **Fix**: Testovat happy path, prazdny list, Observable variantu.

### G6: PlaceService selectedPlace setter neoveruje placeRole$ emise [MEDIUM]
- **Soubor**: `place.service.ts` radky 34-45
- **Fix**: Subscribe na `placeRole$`, nastavit `selectedPlace`, flush HTTP, overit emisi.

### G7: OrderService editItem s neexistujicim item [MEDIUM]
- **Soubor**: `order.service.ts` radek 35-42
- **Fix**: Test `editItem` s item ktery neni v kosiku - overit ze items a total zustane nezmeneny.

### G8: UsersService getPublicUserIdByCardUid a getPublicUserInfo bez testu [MEDIUM]
- **Soubor**: `users.service.ts` radky 110-119
- **Popis**: `getPublicUserInfo` ma subtilni check `Object.keys(result).length === 0 ? null : result`.
- **Fix**: Testovat obe metody vcetne empty object -> null konverze.

### G9: UsersService getUserTransactions a unblockUser bez testu [MEDIUM]
- **Soubor**: `users.service.ts` radky 74-78, 95-103
- **Fix**: Pridat testy pro filter/orderBy/pagination parametry.

### G10: TransactionService.getExcelStatistics bez testu [MEDIUM]
- **Soubor**: `transaction.service.ts` radky 55-58
- **Popis**: Pouziva `responseType: 'blob' as 'json'` hack.
- **Fix**: Test ze posila GET s `responseType: 'blob'`.

### G11: PlaceService.getPlaceTransactions bez testu [MEDIUM]
- **Soubor**: `place.service.ts` radky 120-128
- **Fix**: Test GET s filter, page, pageSize parametry.

### G12: AlertService.error() double-spread bug [MEDIUM]
- **Soubor**: `alert.service.ts` radky 23-28
- **Fix**: Test s custom `{panelClass: 'x'}` + opravit bug.

### G13: Utils.createWalletHash bez testu [MEDIUM]
- **Soubor**: `Utils.ts` radky 40-49
- **Fix**: Test SHA-256 hash, 6 znaku, uppercase.

### G14: AuthInterceptor - expired token stale posilany [CRITICAL]
- **Soubor**: `auth.interceptor.ts` radky 31-37
- **Popis**: Po detekci expirace se stale nastavi Authorization header. Chybi test co overuje spravne chovani.
- **Fix**: Testovat ze expired token neni poslan + opravit interceptor.

### G15: Zadne HTTP error path testy v zadne sluzbe [HIGH]
- **Soubor**: Vsechny HTTP service spec soubory
- **Popis**: Zadny test nepouziva `req.flush('error', {status: 404})` ani `req.error(...)`.
- **Fix**: Pridat alespon 1 error test na sluzbu.

---

## 3. TEST QUALITY (12 issues)

### Q1: setTimeout hacks v CustomerService [CRITICAL]
Duplicita s C1 - viz vyse.

### Q2: Subscription memory leaks v OrderService [HIGH]
- **Soubor**: `order.service.spec.ts` radky 95-103, 107-138
- **Popis**: Subscribe na `balance$` a `orderChange$` bez unsubscribe.
- **Fix**: Ulozit subscription, unsubscribe v afterEach, nebo pouzit `take(N)`.

### Q3: Chybejici httpMock.verify() v OrderService a CustomerService [HIGH]
- **Soubor**: `order.service.spec.ts`, `customer.service.spec.ts`
- **Fix**: Pridat afterEach s cleanup.

### Q4: Nekonzistentni mix Observable/Promise patternu v GroupsService [MEDIUM]
- **Soubor**: `groups.service.spec.ts`
- **Fix**: Sjednotit na `done()` callback nebo `firstValueFrom` + async/await.

### Q5: Magic numbers rozesete po testech [MEDIUM]
- **Soubory**: 6+ spec souboru
- **Popis**: `999`, `15`, `3000` atd. bez pojmenovanych konstant.
- **Fix**: Definovat konstanty nebo importovat z source.

### Q6: Nekonzistentni localStorage cleanup [HIGH]
- **Soubory**: `auth.interceptor.spec.ts`, `auth.service.spec.ts`, `place.service.spec.ts`, `place.guard.spec.ts`
- **Fix**: Standardizovat `localStorage.clear()` v beforeEach I afterEach.

### Q7: "should be created" boilerplate testy bez hodnoty [LOW]
- **Soubory**: Vsechny TestBed spec soubory
- **Fix**: Nechat jako konvenci, ale nepocitat do coverage metriky.

### Q8: Zadne negativni/error testy pro HTTP sluzby [HIGH]
Duplicita s G15 - viz vyse.

### Q9: DRY poruseni - mockConfig duplikovan v 8 souborech [LOW]
- **Fix**: Vytvorit sdileny `src/app/testing/mock-config.ts`.

### Q10: PlaceService BehaviorSubject na module-level leakuje mezi testy [MEDIUM]
- **Soubor**: `place.service.spec.ts` radek 13
- **Fix**: Vytvorit v beforeEach, kompletovat v afterEach.

### Q11: Nepopisne nazvy testu [LOW]
- **Soubor**: `order.service.spec.ts` radky 107, 120, 132
- **Fix**: Prejmenovani na format "should [behavior] when [condition]".

### Q12: FeatureFlagService test je svazan s aktualnimi hodnotami flagu [MEDIUM]
- **Soubor**: `feature-flag.service.spec.ts`
- **Fix**: Testovat mechanismus, ne hodnoty. Nebo pojmenovat "configuration test".

---

## 4. CACHE DECORATOR (11 issues)

### D1: Cache stav persistuje mezi testy - zadny reset [CRITICAL]
- **Soubory**: Vsechny HTTP service spec soubory + `cache.ts`
- **Popis**: `@cache` decorator vytvari closure na prototype - sdilena mezi vsemi instancemi. Zadny test nevola cache reset.
- **Fix**: Exportovat `clearAllCaches()` z `cache.ts`, volat v beforeEach.

### D2: `getUsers()` default-args kolize cache mezi testy [CRITICAL]
- **Soubor**: `users.service.spec.ts` radky 41-52
- **Popis**: Vola se `getUsers()` se stejnymi default argumenty - druhy test dostane cache z prvniho.
- **Fix**: Resetovat cache, nebo pouzit unikatni argumenty.

### D3: `getTransactionDetail` kolize cache pro id=1 [CRITICAL]
- **Soubor**: `transaction.service.spec.ts` radky 41-48
- **Fix**: Resetovat cache mezi testy.

### D4: @cache wrappuje return type na Promise - testy neverifikuji transformaci [MEDIUM]
- **Popis**: Prvni call vraci original promise, cache call vraci `Promise.resolve(cached)`. Testy testuj jen prvni path.
- **Fix**: Pridat testy pro chovani cached calls.

### D5: @invalidateCache metody nejsou testovany pro invalidacni chovani [HIGH]
- **Popis**: Zadny test neoveruje ze po `editUser()` je dalsi `getUsers()` fresh HTTP call.
- **Fix**: Pridat cache-then-invalidate-then-refetch integracni testy.

### D6: cacheTags je globalni objekt ktery leakuje mezi test suites [HIGH]
- **Soubor**: `cache.ts` radek 48
- **Fix**: Resetovat `cacheTags` v beforeEach.

### D7: setTimeout cleanup v createCacher vytvari orphaned timery [MEDIUM]
- **Soubor**: `cache.ts` radky 112-117
- **Fix**: Ulozit timeout handles, poskytnout cleanup mechanismus.

### D8: CurrencyService.getDefaultCurrency ma triple-layer cache [HIGH]
- **Soubor**: `currency.service.ts` radky 40-47
- **Popis**: `@cache` dekorator + manualni `this.defaultCurrency` check + `getCurrencies()` je taky `@cache`. Interakce netestovana.
- **Fix**: Odebrat redundantni vrstvu + napsat testy.

### D9: @invalidateCache provadi invalidaci v detached .then() [MEDIUM]
- **Soubor**: `cache.ts` radky 30-33
- **Popis**: `manualInvalidate` bezi v oddelene `.then()` chain - caller dostane promise pred invalidaci.
- **Fix**: Zmenit na `return result.then(...)`.

### D10: PlaceService getAllPlaces/getPlaces sdili cache tag PLACES [MEDIUM]
- **Popis**: Invalidace jedne metody ovlivnuje druhou. Neni testovano.
- **Fix**: Dedickovane testy pro tag-based invalidaci.

### D11: First-call passthrough vraci raw promise, ne .then(dataSave) chain [LOW]
- **Soubor**: `cache.ts` radek 136
- **Fix**: Vratit `.then(dataSave)` misto raw promise.

---

## 5. BUILD/CONFIG (12 issues)

### B1: ChromeHeadlessNoSandbox definovan ale nikdy aktivovan [HIGH]
- **Soubor**: `karma.conf.js` radek 47
- **Popis**: `browsers: ['Chrome']` - custom launcher se nepouziva defaultne.
- **Fix**: Pridat npm script `"test:ci": "ng test --browsers=ChromeHeadlessNoSandbox --watch=false"`.

### B2: --no-sandbox je security risk mimo CI [MEDIUM]
- **Fix**: Pouzit environment-based selekci nebo drzet jen v CI scriptu.

### B3: Test styles (Material theme) vs Build styles (Bootstrap) - misalignment [HIGH]
- **Soubor**: `angular.json` radky 33 vs 112
- **Fix**: Sjednotit - obe targety by mely mit stejne styles.

### B4: @angular/material v16 s @angular/core v17 - major version mismatch [HIGH]
- **Soubor**: `package.json`
- **Fix**: Upgrade Material + CDK na v17.

### B5: web-bluetooth types v tsconfig.spec.json ale ne v tsconfig.app.json [MEDIUM]
- **Fix**: Pridat `"web-bluetooth"` i do `tsconfig.app.json`.

### B6: Karma singleRun:false - CI bude viset [HIGH]
- **Soubor**: `karma.conf.js` radek 48
- **Fix**: CI script musi mit `--watch=false`.

### B7: .gitlab-ci.yml nema test stage [HIGH]
- **Fix**: Pridat test stage s `ng test --watch=false --browsers=ChromeHeadlessNoSandbox`.

### B8: CI pouziva node:latest a ruby:latest [MEDIUM]
- **Fix**: Pinovat konkretni verze.

### B9: Build tooling v dependencies misto devDependencies [MEDIUM]
- **Soubor**: `package.json`
- **Fix**: Presunout `@angular-devkit/build-angular`, `@angular/cli`, `typescript` do devDependencies.

### B10: @types/jasmine 3.10 vs jasmine-core 4.0 [LOW]
- **Fix**: Upgrade na `@types/jasmine ~4.0.0`.

### B11: @types/node 12 je extremne zastaraly [LOW]
- **Fix**: Upgrade na `@types/node ^18.0.0`.

### B12: tsconfig.json trailing comma [LOW]
- **Fix**: Odebrat trailing comma na radku 34.

---

## PRIORITIZOVANE NAVRHY UPRAV

### Tier 1 - Opravit HNED (blocker pro redesign)

| # | Issue | Akce |
|---|-------|------|
| 1 | D1+D2+D3+D6 | Pridat `clearAllCaches()` do `cache.ts`, volat v `beforeEach` vsech HTTP service testu |
| 2 | C1+C2 | Prepsat CustomerService testy na `fakeAsync`/`tick` |
| 3 | C5+G12 | Opravit double-spread bug v `AlertService.error()` + pridat test |
| 4 | C6+G14 | Opravit AuthInterceptor - neposilat expired token + opravit test |
| 5 | C9 | GroupsService - pridat `done()` callback do subscribe testu |
| 6 | Q6 | Sjednotit localStorage cleanup na `localStorage.clear()` v beforeEach+afterEach |

### Tier 2 - Opravit pred redesignem (kriticke mezery)

| # | Issue | Akce |
|---|-------|------|
| 7 | G1 | Napsat dedickovane testy pro cache decorator |
| 8 | G2 | Pridat error path testy pro financni operace CustomerService |
| 9 | G15 | Pridat alespon 1 error path test na HTTP sluzbu |
| 10 | G4 | Opravit CustomerService.transformUserName - return value se zahazuje |
| 11 | G5 | Napsat testy pro CurrencyService.getDefaultCurrency |
| 12 | G8+G9+G10+G11 | Dopsat chybejici metody v UsersService, TransactionService, PlaceService |

### Tier 3 - Nice to have

| # | Issue | Akce |
|---|-------|------|
| 13 | Q2 | Opravit subscription leaks v OrderService testech |
| 14 | Q9 | Vytvorit sdileny mock-config.ts |
| 15 | B3 | Sjednotit test/build styles v angular.json |
| 16 | B5 | Pridat web-bluetooth types do tsconfig.app.json |
| 17 | B7 | Pridat test stage do .gitlab-ci.yml |
