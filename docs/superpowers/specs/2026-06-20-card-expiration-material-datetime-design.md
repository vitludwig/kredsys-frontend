# Card expiration dialog — Material datum + čas

**Date:** 2026-06-20
**Status:** Approved
**Scope:** `card-expiration-dialog` komponenta (user-info dashboard) + její unit test

## Problém

Dialog pro nastavení expirace čipu/vstupenky používá holý nativní
`<input type="datetime-local">`. Renderuje se jako bílé pole bez Material stylu a
nezapadá do vizuálu zbytku aplikace.

## Cíl

Nahradit nativní input dvěma Material poli, která sdílí jeden `Date` model:

- **Datum** — `MatDatepicker` (Material kalendář popup)
- **Čas** — `MatTimepicker` (Material dropdown, zaveden v Angular Material 19+)

Plně nativní Material řešení, **žádná nová závislost** (oba moduly jsou součástí
nainstalovaného `@angular/material@21`).

## Zvolený přístup a alternativy

Zvažovány tři varianty:

1. **Native Material: datum + čas (2 pole)** — *zvoleno*. Bez nové závislosti,
   plně themed vzhled, locale `cs-CZ` už nastaven na app úrovni. Kompromis: dva
   inputy místo jednoho kombinovaného.
2. **Knihovna s jedním kombinovaným inputem**
   (`@angular-material-components/datetime-picker`) — zamítnuto kvůli nové
   závislosti a riziku kompatibility s Angular 21 (knihovna historicky pokulhává
   za major verzemi).
3. **Obalit nativní input do `mat-form-field`** (jako `transactions-list`) —
   zamítnuto, popup kalendář by zůstal nativní/prohlížečový, ne Material.

## Návrh

### `card-expiration-dialog.component.ts`

- Model `value` změna z `string` na `Date | null`.
- Přidat do `imports`: `MatFormFieldModule`, `MatInputModule`,
  `MatDatepickerModule`, `MatTimepickerModule`.
- Přidat `providers: [provideNativeDateAdapter()]`. App už poskytuje
  `MAT_DATE_LOCALE: 'cs-CZ'` (`app.module.ts`), takže datum se zobrazí jako
  `dd.MM.yyyy` a čas 24h `HH:mm`.
- Konverze zůstávají sémanticky stejné, jen pracují s `Date` místo se stringem:
  - **čtení**: `expirationDate` (ISO; `utcDateInterceptor` ho na čtení označí
    jako UTC) → `new Date(iso)` nebo `null` při prázdné/nevalidní hodnotě.
  - **ukládání**: `value ? value.toISOString().slice(0, 19) : null`. Tím se
    **přesně zachová** dnešní zone-less-UTC round-trip — backend ukládá
    timestampy naive-as-UTC a interceptor je na čtení re-taguje jako UTC, takže
    wall-clock projde tam i zpět bez `+offset` driftu. Bez koncového `Z` zůstává
    `Kind=Unspecified` pro sloupec `timestamp without time zone`.
- `onSave` / `onClear` / `onCancel` chování beze změny:
  - clear i prázdná hodnota (`value === null`) → `close(null)`
  - cancel → `close(undefined)`

### `card-expiration-dialog.component.html`

- Místo jednoho `<label><input datetime-local>` dvě `<mat-form-field>` vedle sebe
  pod popiskem „Platnost do":
  - **Datum**: `<input matInput [matDatepicker]="datePicker"
    [(ngModel)]="value" data-testid="expiration-date">` +
    `<mat-datepicker-toggle matIconSuffix [for]="datePicker"/>` +
    `<mat-datepicker #datePicker/>`
  - **Čas**: `<input matInput [matTimepicker]="timePicker"
    [(ngModel)]="value" data-testid="expiration-time">` +
    `<mat-timepicker-toggle matIconSuffix [for]="timePicker"/>` +
    `<mat-timepicker #timePicker/>`
  - Obě pole jsou vázaná na stejný `value` (`Date`): datepicker při výběru data
    zachová čas, timepicker při výběru času zachová datum (oficiální Material
    pattern).
- Beze změny zůstává: nadpis (`Expirace čipu` / `Expirace vstupenky`),
  `data-testid="cascade-warning"`, tlačítka akcí včetně
  `data-testid="expiration-save"`.

### `card-expiration-dialog.component.spec.ts`

- Upravit tři testy navázané na string model na `Date` model:
  - *prefill z ISO* → `value instanceof Date` s odpovídajícím wall-clock.
  - *prázdné při chybějící expiraci* → `value === null`.
  - *round-trip uložení* — zachovat assertion: `onSave` vrátí zone-less UTC
    string `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$`, re-read (`new Date(saved+'Z')`)
    dá původní wall-clock.
- Testy cascade/title/clear/cancel zůstávají beze změny.

## Chování / poznámky

- Pokud uživatel vybere datum a čas nechá nedotčený, sdílený `Date` nese `00:00`
  — stejná explicitnost jako dnešní nativní input. Sémantika expirace se nemění,
  mění se jen vizuál.
- Locale `cs-CZ` je už nakonfigurovaný globálně, není potřeba nic dalšího
  registrovat.

## Mimo rozsah

- Žádná změna v `user-info-cards` (volající), v backendu ani ve formátu API.
- Žádné kombinované single-input řešení ani nová knihovna.
