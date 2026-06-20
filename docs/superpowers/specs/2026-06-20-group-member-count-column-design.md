# Sloupec „Počet členů" v tabulce Správa skupin

**Date:** 2026-06-20
**Status:** Approved
**Scope:** BE `kredsys-backend` (groups list endpoint) + FE `kredsys-frontend` (groups-list table)

## Problém / cíl

Tabulka „Správa skupin" (`groups-list`) zobrazuje jen název a akce. Chceme přidat
sloupec s počtem členů (uživatelů) ve skupině.

## Zvolený přístup a zamítnuté alternativy

Vztah uživatel–skupina je na straně uživatele (`IUser.groups: number[]`,
join tabulka `UserGroups`); skupina (`IGroup`) počet členů nenese a žádný
endpoint nevrací členy skupiny. Zvažené varianty:

1. **FE-only počítání** — načíst všechny uživatele na klient a spočítat per
   skupina. Zamítnuto: tahání všech uživatelů, stránkování `getUsers`, řešení
   blokovaných (`blocked` je exact-match filtr).
2. **Přes `groups-statistics` endpoint** — zamítnuto kvůli perf: ten endpoint
   dělá těžkou transakční agregaci (`GROUP BY goods` per skupina), je per-měna
   a polluje se v Statistikách skupin po 10 s. Přidat ho jako druhého volajícího
   jen kvůli počtu členů (a 99 % výsledku zahodit) je plýtvání. Navíc by se
   muselo řešit `currencyId` v management tabulce.
3. **Počet na levném `getGroups` endpointu** — *zvoleno*. Počet členů je
   currency-nezávislý a `getGroups` tabulka už volá. Přidá se jako levný SQL
   `COUNT` poddotaz.

## Klíčové technické zjištění

- BE má **zapnuté lazy-loading proxy** (`UseLazyLoadingProxies()`). Kdyby
  `MemberCount` viselo na sdíleném `GroupDto.Read`, ve `groups-statistics`
  endpointu (kde se `Group` materializuje a pak `.Adapt()`-ne v paměti) by se
  `Users.Count` lazy-načetlo → N+1 přes uživatele každých 10 s. Proto počet
  dostane **vlastní list-DTO** používané jen v `GET /groups`, kde
  `GridifyToAsync` dělá Mapster **queryable projekci** (`ProjectToType`) →
  `Users.Count` se přeloží na SQL `COUNT` poddotaz (žádná materializace, žádný
  lazy load).
- `UserGroups` má FK index na `GroupId` → `COUNT` je levný.
- `GridifyDtoPaginator.MapDtoObject` (reflexe pro gridify filtr/řazení) hledá
  `Group.MemberCount`, nenajde a přeskočí → po `memberCount` nelze filtrovat/řadit
  přes gridify (akceptováno, není potřeba).

## Backend (`kredsys-backend`)

### `App/API/V1/DTO/GroupDto.cs`
- Přidat variantu:
  ```csharp
  public class ReadWithCount : Read
  {
      /// <summary>Počet uživatelů ve skupině.</summary>
      public int MemberCount { get; set; }
  }
  ```
- Do `GroupDtoMapper.Register`:
  ```csharp
  config.NewConfig<Group, GroupDto.ReadWithCount>()
      .Map(dest => dest.MemberCount, src => src.Users.Count);
  ```

### `App/API/V1/Controllers/GroupsController.cs` — `GetAllGroups`
- Změnit cílové DTO z `GroupDto.Read` na `GroupDto.ReadWithCount`:
  ```csharp
  [ProducesResponseType(typeof(Paging<GroupDto.ReadWithCount>), 200)]
  ...
  var paginator = GridifyDtoPaginatorFactory.Create<Group, GroupDto.ReadWithCount>(
      GroupRepository.GetAll(), query);
  paginator.SetDefaultOrder("Id");
  return Ok(await paginator.PaginateAsync());
  ```
- `GroupDto.Read`, `GetGroupById`, `groups-statistics` a ostatní akce zůstávají
  **beze změny**.

## Frontend (`kredsys-frontend`)

### `src/app/modules/groups/types/IGroup.ts`
```typescript
export interface IGroup {
  id: number;
  name: string;
  description: string;
  color: string;
  memberCount?: number; // dodává jen list endpoint (GET /groups); getGroup(id)/stats ho nemají
}

export interface IGroupCreate extends Omit<IGroup, 'id' | 'memberCount'> {}
```

### `src/app/modules/groups/components/groups-list/groups-list.component.ts`
- `displayedColumns = ['name', 'memberCount', 'actions'];`
- Žádné nové volání služby — `getGroups()` už `memberCount` vrací.

### `src/app/modules/groups/components/groups-list/groups-list.component.html`
- Nový sloupec mezi `name` a `actions`:
  ```html
  <ng-container matColumnDef="memberCount">
    <th mat-header-cell *matHeaderCellDef>Počet členů</th>
    <td mat-cell *matCellDef="let group">{{ group.memberCount ?? '—' }}</td>
  </ng-container>
  ```
  (Konkrétní syntaxe `*matHeaderCellDef`/`*matCellDef` se sladí se stávajícími
  sloupci `name`/`actions` v tom souboru.)

## Testy

- **BE** — test groups list endpointu: skupina s N přiřazenými uživateli →
  `MemberCount == N`; skupina bez uživatelů → `0`.
- **FE `groups.service.spec`** — `getGroups` mock odpovědi doplnit o `memberCount`.
- **FE `groups-list.spec`** — mock skupin s `memberCount`, ověřit, že se sloupec
  vykreslí se správnou hodnotou a `displayedColumns` obsahuje `'memberCount'`.

## Mimo rozsah

- Žádná změna `groups-statistics` (modelu, DTO, služby) ani jeho 10s pollingu.
- Žádný filtr/řazení tabulky podle počtu členů.
- Počet členů se nepřidává na `GroupDto.Read` ani `getGroup(id)`.
