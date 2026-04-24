---
name: Types & Enums
description: All TypeScript interfaces, types, and enums used across the codebase
load_when: adding a new type, using an existing entity, template type errors, understanding data shapes
---

# Types & Enums

All shared types: `src/app/common/types/`
Groups-specific types: `src/app/modules/groups/types/`

---

## Core entities

```typescript
interface IUser {
  id?: number;
  name: string;
  email: string;
  password?: string;
  memberId: number | null;
  roles: EUserRole[];       // always an array, never null/undefined
  blocked: boolean;
  groups?: number[];        // group IDs, may be absent
}

enum EUserRole {
  ADMIN = 'Admin',
  MEMBER = 'Member',
  WORKER = 'Worker',
  POWER_SALESMAN = 'PowerSalesman'
}

interface IPlace {
  id?: number;
  name: string;
  type?: EPlaceRole;
  apiToken?: string;
}

enum EPlaceRole {
  BAR = 'Bar',
  USER_INFO = 'UserInfo',
  REGISTRATION = 'Registration',
  INFO_POINT = 'Info'
}

interface IGoods {
  id?: number;
  goodsTypeId: number | null;
  name: string;
  price: number | null;
  currencyId: number | null;
  placeId: number | null;
  deleted: boolean;
}

interface IGoodsType {
  id?: number;
  name: string;
  icon: string;
  deleted: boolean;
}

interface ICurrency {
  id?: number;
  name: string;
  code: string;
  symbol: string;
  minRechargeAmountWarn: number;
  maxRechargeAmountWarn: number;
  blocked: boolean;
}

interface ICurrencyAccount {
  id: number;
  userId: number;
  overdraftLimit: number;   // POSITIVE — max allowed negative balance
  currentAmount: number;    // always number, never undefined
  currencyId: number;
}
```

## Groups types (`modules/groups/types/`)

```typescript
interface IGroup { id: number; name: string; color: string; }
interface IGroupCreate { name: string; color: string; }
interface IGroupStatistics { group: IGroup; items: IGroupStatisticsItem[]; }
interface IGroupStatisticsItem { label: string; value: number; }
```

## Utility types

```typescript
interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

type HashMap<T> = { [key: string]: T };
type EnumHashMap<TKey extends string, TValue> = { [key in TKey]: TValue };
type TAnyFunction = (...args: any[]) => any;

interface CanComponentDeactivate {
  canDeactivate(): boolean | Promise<boolean>;
}
```

## Route enum

```typescript
enum ERoute {
  LOGIN = 'login',
  LOGIN_SIGN_IN = 'sign-in',
  SALE = 'sale',
  ADMIN = 'admin',
  ADMIN_USERS = 'users',
  ADMIN_PLACES = 'places',
  ADMIN_GOODS = 'goods',
  ADMIN_GOODS_TYPES = 'types',
  ADMIN_CURRENCIES = 'currencies',
  ADMIN_CHARGE = 'charge',
  ADMIN_TRANSACTIONS = 'transactions',
  ADMIN_CHANGE_PASSWORD = 'change-password',
  ADMIN_GROUPS = 'groups',
  ADMIN_STATISTICS = 'statistics',
  PLACE_SELECT = 'place-select',
  CHECK_IN = 'check-in',
  CARD_INFO = 'card-info',
  PUBLIC = 'public',
  EDIT = 'edit',
  NEW = 'new'
}
```

## Cache tags

```typescript
enum ECacheTag {
  USER, USERS, USER_CARDS,
  TRANSACTION, TRANSACTIONS,
  GOODS, GOODIE,
  CURRENCY, CURRENCIES,
  PLACE, PLACES,
  CARDS
}
```

## Time constants

```typescript
enum ETime {
  SECOND = 1000,
  MINUTE = 60000,
  HOUR = 3600000,
  DAY = 86400000,
  WEEK = 604800000
}
```

## Feature flags

```typescript
enum EFeatureFlag {
  PRINTER = 'printer'
}
```

## Overdraft note

`overdraftLimit` is a **positive** number. Template comparison:
```html
totalLeft < -((account$ | async)?.overdraftLimit ?? 0)
```
