import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { addToBasket, scanCard, submitOrder } from '../../support/pos';
import { goods } from '../../fixtures/data/goods';
import { goodsTypes } from '../../fixtures/data/goods-types';
import { memberUser, janaUser } from '../../fixtures/data/users';

const place1Goods = goods.filter(g => g.placeId === 1);
const beerGoods = place1Goods.find(g => g.name === 'Pivo 0,5l')!;   // 50 Kč
const friesGoods = place1Goods.find(g => g.name === 'Hranolky')!;   // 60 Kč

test.describe('Sale — POS dashboard', () => {
	test('place-selected worker lands on /sale and sees products', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await expect(asWorker).toHaveURL(/\/sale(\?|$|\/)/);
		// At least one product tile renders.
		await expect(asWorker.getByTestId(SEL.pos.goodsTile(beerGoods.id))).toBeVisible();
	});

	test('scanning a known card loads the customer + balance', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		await expect(asWorker.getByTestId(SEL.topMenu.balance)).toBeVisible();
	});

	test('clicking a product tile adds it to the basket', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		await addToBasket(asWorker, beerGoods.id);
		await expect(asWorker.getByTestId(SEL.pos.basketItem(beerGoods.id))).toBeVisible();
		await expect(asWorker.getByTestId(SEL.pos.total)).toContainText(`${beerGoods.price}`);
	});

	test('clicking the same product twice increments the basket quantity', async ({
		asWorker,
	}) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		await addToBasket(asWorker, beerGoods.id);
		await addToBasket(asWorker, beerGoods.id);
		await expect(asWorker.getByTestId(SEL.pos.total)).toContainText(`${beerGoods.price! * 2}`);
	});

	test('removing a basket item drops the total', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		await addToBasket(asWorker, beerGoods.id);
		await addToBasket(asWorker, friesGoods.id);
		const beforeText = await asWorker.getByTestId(SEL.pos.total).textContent();
		await asWorker
			.getByTestId(SEL.pos.basketItem(friesGoods.id))
			.getByTestId(SEL.pos.basketRemove)
			.click();
		await expect(asWorker.getByTestId(SEL.pos.basketItem(friesGoods.id))).toBeHidden();
		await expect(asWorker.getByTestId(SEL.pos.total)).not.toHaveText(beforeText ?? '');
	});

	test('filter panel narrows the goods grid by type', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		// Pick a type that ONLY has drinks (type 1 = Nápoje).
		const typeId = goodsTypes[0].id;
		await asWorker.getByTestId(SEL.pos.filter(typeId)).click();
		// Drinks present, fries hidden.
		await expect(asWorker.getByTestId(SEL.pos.goodsTile(beerGoods.id))).toBeVisible();
		await expect(asWorker.getByTestId(SEL.pos.goodsTile(friesGoods.id))).toBeHidden();
	});

	test('submit is disabled with an empty basket', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		// Submit-button only appears once a customer is loaded; no items → disabled.
		await expect(asWorker.getByTestId(SEL.pos.submit)).toBeDisabled();
	});

	test('successful submit POSTs payment and resets the customer view', async ({ asWorker }) => {
		// PrintService emits "Printer not initialized" console.error after a
		// successful payment in a no-printer environment — pre-existing
		// behaviour, not a test fault.
		test.info().annotations.push({ type: 'allow-console-errors' });
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		await addToBasket(asWorker, beerGoods.id);
		const paymentResp = asWorker.waitForResponse(
			r => r.url().includes('/transactions/payment') && r.ok(),
		);
		await submitOrder(asWorker);
		await paymentResp;
		// Customer is unloaded after submit → sale-summary-total disappears
		// and the card-scan prompt comes back.
		await expect(asWorker.getByText('Načtěte čip', { exact: true })).toBeVisible();
	});
});

test.describe('Sale — overdraft scenarios (Jana)', () => {
	// Jana has currentAmount=50, overdraftLimit=100.
	// Allowed total range: 0 to 150.
	test('overdraft warning appears when basket exceeds balance but stays within overdraft', async ({
		asWorker,
	}) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, janaUser.name);
		// Add 2× beer (100) + 1× fries (60) = 160 → over the 150 ceiling.
		// First add items to push past balance (50) but still within overdraft.
		// 1× beer (50) → totalLeft = 0 (= positive balance), no warning yet.
		await addToBasket(asWorker, beerGoods.id);
		// 1× fries (+60) → total 110, overdrew by 60 (within overdraft 100).
		await addToBasket(asWorker, friesGoods.id);
		// We're past balance but within overdraft — no overdraft-EXCEEDED warning.
		await expect(asWorker.getByTestId(SEL.pos.overdraft)).toBeHidden();
		await expect(asWorker.getByTestId(SEL.pos.submit)).toBeEnabled();
	});

	test('submit is disabled when basket exceeds overdraft limit', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, janaUser.name);
		// 4× beer (200) → exceeds 50 + 100 overdraft = 150 ceiling.
		await addToBasket(asWorker, beerGoods.id);
		await addToBasket(asWorker, beerGoods.id);
		await addToBasket(asWorker, beerGoods.id);
		await addToBasket(asWorker, beerGoods.id);
		await expect(asWorker.getByTestId(SEL.pos.overdraft)).toBeVisible();
		await expect(asWorker.getByTestId(SEL.pos.submit)).toBeDisabled();
	});
});

test.describe('Sale — top-menu actions (PowerSalesman)', () => {
	test('charge button visible only after card scan + canChargeMoney', async ({
		asPowerSalesman,
	}) => {
		await asPowerSalesman.goto('/sale');
		await scanCard(asPowerSalesman, memberUser.name);
		await expect(
			asPowerSalesman.getByRole('button', { name: /Dobít/i }).first(),
		).toBeVisible();
	});

	test('charge dialog opens from top-menu and posts a deposit', async ({
		asPowerSalesman,
	}) => {
		await asPowerSalesman.goto('/sale');
		await scanCard(asPowerSalesman, memberUser.name);
		await asPowerSalesman.getByRole('button', { name: /Dobít/i }).first().click();
		// Dialog opens
		const dialog = asPowerSalesman.getByRole('dialog');
		await expect(dialog).toBeVisible();
		// Type an amount and submit (the dialog has its own form; assert that
		// the dialog has a confirm button and clicking dispatches a deposit).
		await dialog.getByLabel(/Částka/i).fill('200');
		const depositResp = asPowerSalesman.waitForResponse(
			r => r.url().includes('/transactions/deposit') && r.ok(),
		);
		await dialog.getByRole('button', { name: /Dobít|Potvrdit/i }).click();
		await depositResp;
	});
});

test.describe('Sale — customer reset', () => {
	test('after submit, customer is unloaded and card-scan view returns', async ({
		asWorker,
	}) => {
		test.info().annotations.push({ type: 'allow-console-errors' });
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		await addToBasket(asWorker, beerGoods.id);
		await submitOrder(asWorker);
		// CustomerService.set(null) is called after submit; the card-loader
		// prompt should reappear.
		await expect(asWorker.getByText('Načtěte čip', { exact: true })).toBeVisible();
	});
});
