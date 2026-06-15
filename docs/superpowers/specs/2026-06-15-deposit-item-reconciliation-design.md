# Deposit-item (cup/card) reconciliation — design & brainstorm

**Date:** 2026-06-15
**Status:** Deferred (brainstorm captured; not implemented)
**Area:** transactions / statistics export (FE + BE), settlement logic

## Context

Deposit items (cups, but also chip cards or anything refundable — "zálohované věci") flow through
the system as:

1. **Buy** — the customer buys a cup; it is sold as a normal goods item, so it lands in the **bar's
   sales statistics** (tržba baru). The cup price is the deposit (záloha).
2. **Return** — the customer hands the cup back; the barman uses **"Vrátit zálohu"** (top-menu →
   `DepositReturnDialogComponent`), which **deposits the deposit amount back onto the card**.

## Problem

Two issues:

- **(a) No evidence of returned cups.** *(partially solved — see "Already done".)*
- **(b) Accounting hole / double payment.** The buy is recorded as bar revenue and the return is an
  unrelated card top-up. The system does not recognise that a returned cup's refund cancels a deposit
  that was part of the bar's sales. So the **organisation pays twice**: once to the bar (for the cup
  sale) and again to the customer (the refund onto the card). This is specifically broken when the
  **organisation and the bar are not the same legal subject**.

### Money ledger for one 25 Kč cup (org ≠ bar)

1. Buy: card −25, **bar sales +25** → at settlement org pays bar 25.
2. Return: card +25 (funded by org; customer can withdraw/spend it).
3. Result: **bar +25, org −25, customer 0, cup back.** Org paid for a sale that came back.

A cup that is both bought and returned must net to **0 for everyone**.

## Already done (groundwork, shipped in the deposit-return feature)

- `DepositReturnDialogComponent` writes a stable marker into the transaction: `info` (and record
  `text`) = `Vrácení zálohy: 2× Kelímek, 1× Karta`. → **return side is now identifiable/filterable.**
- The **buy side is NOT tagged** — a cup sale is still an ordinary goods sale. This asymmetry is the
  key gap.

## Proposed approach under discussion (per-bar "mirror") and its holes

Idea: keep a separate mirror/ledger of cups, exclude cups from kredsys money calcs, and at settlement
compute `Rozdíl = počáteční − koncový stav`, with `Rozdíl >= 0`, counting `Rozdíl` into bar money.

Holes found:

1. **Buy side not tagged** — "prodáno − vráceno" needs reliable identification of *both* sides;
   matching by goods name/price is fragile.
2. **`Rozdíl >= 0` fails across bars** — buy at bar A, return at bar B ⇒ bar B returns > sales ⇒
   `Rozdíl < 0`. Clamping misattributes money between bars. Per-bar netting breaks exactly in the
   org ≠ bar case.
3. **Forfeited-deposit policy undecided** — "Rozdíl into bar money" assumes the bar keeps unreturned
   deposits; maybe the org should. Contract decision.
4. **Count-based netting is wrong with multiple deposit types/amounts**, and the **amount must be
   captured at transaction time**, not recomputed from the (mutable) config.
5. **Physical mirror diverges from the system** — cards are topped up with real money regardless of
   physical cups (loss/breakage/cups taken home). Bar settlement and the card float must stay
   consistent or the org leaks money.
6. **Refund without a matching buy / fraud** — "Vrátit zálohu" credits any quantity; a customer can
   be refunded for cups never bought (or bought elsewhere). Aggregates only partially hide this.
7. **Storno** of either the buy or the return is not accounted for.

## Recommended model: deposit = org pass-through, never bar revenue

Tag the deposit on **both** sides and **exclude it from bar revenue entirely**:

- **Buy (deposit collected)** — bar collects on behalf of the org → an org liability to the customer,
  **not bar sales**.
- **Return (deposit refunded)** — bar refunds on behalf of the org (already marked).
- **Settlement** — bar payout = real sales only (no deposits). Deposits are a separate org pool:
  `collected − refunded = forfeited` → org revenue (or per contract).

Why it beats the mirror: the **cross-bar problem disappears** (the org is the counterparty for all
deposits — no inter-bar clearing), `Rozdíl >= 0` is irrelevant, and it works identically for org = bar
and org ≠ bar. The only requirement is to identify deposits on both sides and keep them out of bar
revenue.

## Open decisions (resolve before implementing)

1. **How to tag the buy side.** Cleanest: a "zálohovaná věc" flag on the goods item, linking
   `goods ↔ deposit-item config`, so a sale of that good is recognised as a deposit and excluded from
   bar revenue.
2. **Who keeps forfeited (unreturned) deposits** — bar or org?
3. **Single source of truth** — derive deposits from tagged transactions (tagged buy + tagged
   return), not a hand-kept mirror. Use any physical cup inventory only as a fraud/loss cross-check,
   not as the settlement basis.
4. **Refund controls** — limit / pairing of refunds against prior buys (mitigates hole 6).

## Rough implementation sketch (for later)

- BE/goods: add a deposit flag to goods (or link to deposit-item config); capture deposit amount at
  sale time.
- Statistics/export: split transactions into *sales* vs *deposits collected* vs *deposits refunded*;
  bar revenue excludes deposits; add a deposit-pool report (collected / refunded / net forfeited).
- FE: deposit-return marker already in place; surface a deposit reconciliation view/report.

## Status

Deferred. Decision pending on direction (org pass-through vs. mirror) and the open decisions above.
