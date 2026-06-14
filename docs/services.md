---
name: Services
description: All injectable services — APIs, state ownership, HTTP patterns, caching usage
load_when: adding a service method, consuming a service, understanding data flow, auth flow
---

# Services

All services use `HttpClient` + `firstValueFrom()` — return `Promise`, not `Observable`.
HTTP calls go to `environment.apiUrl` = `/api/v1.1/`.

---

## Core services

### `InitService` (`common/services/init/`)
Called by `APP_INITIALIZER`. See `routing-modules.md` for sequence.

### `ConfigService` (`common/services/config/`)
- `load()` — GET `/assets/config.json`, merges into `environment`
- Any key in config.json overrides the same key in `environment`

### `AlertService` (`common/services/alert/`)
- `success(msg)`, `error(msg)`, `info(msg)` — always use this, never open `MatSnackBar` directly

---

## AuthService (`modules/login/services/auth/`)

```typescript
user$: BehaviorSubject<IUser | null>
isLogged$: BehaviorSubject<boolean>
isLogged: boolean
isDebug: boolean

login(email: string, password: string): Promise<void>
logout(): void
tryAutoLogin(): void
```

- JWT stored in `localStorage`
- `login()` → POST `/api/v1.1/authentication/user/email`
- `tryAutoLogin()` → decodes stored token, sets `user$`
- 401 responses handled by `authInterceptor` → calls `logout()`

---

## PlaceService (`modules/admin/services/place/place/`)

```typescript
selectedPlace$: BehaviorSubject<IPlace | null>
selectedPlace: IPlace | null      // sync accessor

getPlaces(): Promise<IPlace[]>                          // @cache
getPlace(id: number): Promise<IPlace>                   // @cache
addPlace(place: IPlace): Promise<IPlace>                // @invalidateCache
editPlace(place: IPlace): Promise<IPlace>               // @invalidateCache
deletePlace(id: number): Promise<void>                  // @invalidateCache

getPlaceGoods(placeId: number): Promise<IGoods[]>       // @cache
addGoods(goodsId: number, placeId: number): Promise<void>
removeGoods(goodsId: number, placeId: number): Promise<void>
moveGoods(placeId: number, goods: IGoods[]): Promise<void>
```

---

## UsersService (`modules/admin/services/users/`)

```typescript
getUsers(): Promise<IUser[]>
getUser(id: number): Promise<IUser>
createUser(user: IUser): Promise<IUser>
updateUser(user: IUser): Promise<void>
deleteUser(id: number): Promise<void>
```

Card methods:

```
getUserCards(id): Promise<IPaginatedResponse<ICard>>            // @cache USER_CARDS
addUserCard(userId, uid, description?, type?, expirationDate?): Promise<ICard>  // @invalidateCache
setUserCardExpiration(card, expirationDate): Promise<ICard>     // PUT cards/{id}, resends type+description
blockUserCard(id): Promise<void>                               // PUT cards/{id}/block
unblockUserCard(id): Promise<void>                             // PUT cards/{id}/unblock
deleteUserCard(id): Promise<void>                              // DELETE cards/{id}; 400 if used by transactions
```

---

## GoodsService (`modules/admin/services/goods/`)

```typescript
getGoods(): Promise<IGoods[]>           // @cache
getGoodsTypes(): Promise<IGoodsType[]>  // @cache
createGoods(goods: IGoods): Promise<IGoods>
updateGoods(goods: IGoods): Promise<void>
deleteGoods(id: number): Promise<void>
createGoodsType(type: IGoodsType): Promise<IGoodsType>
updateGoodsType(type: IGoodsType): Promise<void>
```

---

## CurrencyService (`modules/admin/services/currency/`)

```typescript
defaultCurrency$: BehaviorSubject<ICurrency | null>

getCurrencies(): Promise<ICurrency[]>
getCurrency(id: number): Promise<ICurrency>
getCurrencyAccount(userId: number): Promise<ICurrencyAccount>
createCurrency(c: ICurrency): Promise<ICurrency>
updateCurrency(c: ICurrency): Promise<void>
loadDefaultCurrency(): Promise<void>
```

---

## CardsService (`modules/admin/services/cards/`)
Manages user card assignments. Used in `CheckInModule`.

---

## TransactionService (`modules/admin/services/transaction/`)

```typescript
getTransactions(filters): Promise<IPaginatedResponse<ITransaction>>
getStatistics(): Promise<ITransactionStatistics>
```

---

## OrderService (`modules/sale/services/order/`)

```typescript
items: IOrderItem[]       // current basket (plain array, not observable)
total: number             // computed sum

addItem(item: IGoods): void
removeItem(itemId: number): void
clearOrder(): void
```

---

## CustomerService (`modules/sale/services/customer/`)

```typescript
selectedUser$: BehaviorSubject<IUser | null>
currencyAccount$: BehaviorSubject<ICurrencyAccount | null>
currencyAccount: ICurrencyAccount | null    // sync accessor
```

Fetches and refreshes customer balance when user changes.

---

## SaleService (`modules/sale/services/sale/`)

```typescript
submitOrder(userId: number, items: IOrderItem[]): Promise<void>
storno(transactionId: number): Promise<void>
charge(userId: number, amount: number): Promise<void>
discharge(userId: number, amount: number): Promise<void>
```

---

## PrintService (`modules/sale/services/print/`)

```typescript
isConnected(): boolean          // signal
connectInProgress(): boolean    // signal

connect(): Promise<void>        // Web Bluetooth pairing
disconnect(): void
testPrint(): void
printReceipt(items, total): void
```

Gated by `EFeatureFlag.PRINTER`. Uses `receipt-printer-encoder` UMD bundle from `assets/vendor/`.

---

## GroupsService (`modules/groups/services/`)

```typescript
getGroups(): Promise<IPaginatedResponse<IGroup>>
getGroupStatistics(): Promise<IGroupStatistics[]>
createGroup(g: IGroupCreate): Promise<IGroup>
updateGroup(g: IGroup): Promise<void>
deleteGroup(id: number): Promise<void>
```

---

## FeatureFlagService (`common/modules/feature-flags/`)

```typescript
isAllowed(flag: EFeatureFlag): boolean
```

Use `IsFeatureAllowedPipe` in templates: `EFeatureFlag.PRINTER | isFeatureAllowed`.
