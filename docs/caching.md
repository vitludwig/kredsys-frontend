---
name: Caching System
description: @cache and @invalidateCache decorators — how they work, how to apply them, test cleanup
load_when: adding a cached service method, invalidating cache, debugging stale data, writing tests for cached services
---

# Caching System

Source: `src/app/common/decorators/cache.ts`

## How it works

`createCacher(fn, timeoutMs, tags[])` wraps an async function:
- **First call** with given args → executes the function, stores result
- **Repeat call** (same args, within `timeoutMs`) → returns cached result, no HTTP request
- **Parallel calls** during a fetch → queued; only one HTTP request fires, all callers get same result
- **Eviction** → after `timeoutMs` ms the entry is stale

Cache key = `JSON.stringify(args)`.

## Tag-based invalidation

```typescript
@cache(ETime.MINUTE, [ECacheTag.USERS])
async getUsers(): Promise<IUser[]> { ... }

@invalidateCache([ECacheTag.USER, ECacheTag.USERS])
async updateUser(user: IUser): Promise<void> { ... }
```

`@invalidateCache` bumps a timestamp for each tag after the method resolves.
On next `@cache` read, if `tag.timestamp > fetchTime` → cache is stale → re-fetches.

## Applying to a new service method

```typescript
import { cache, invalidateCache } from 'app/common/decorators/cache';
import { ECacheTag, ETime } from 'app/common/types';

// read
@cache(ETime.MINUTE * 5, [ECacheTag.PLACES])
async getPlaces(): Promise<IPlace[]> {
  return firstValueFrom(this.http.get<IPlace[]>(...));
}

// write
@invalidateCache([ECacheTag.PLACE, ECacheTag.PLACES])
async updatePlace(place: IPlace): Promise<void> {
  await firstValueFrom(this.http.put(...));
}
```

Choose `ECacheTag.*` to group related reads so one write invalidates all of them.

## Test cleanup

Call `clearAllCaches()` in `beforeEach` — otherwise cache state bleeds between tests:

```typescript
import { clearAllCaches } from 'app/common/decorators/cache';

beforeEach(() => {
  clearAllCaches();
  // ...
});
```
