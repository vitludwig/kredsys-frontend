import { test, expect } from '../../support/personas';
import { scanCard } from '../../support/pos';
import { memberUser } from '../../fixtures/data/users';

test.describe('Admin / charge', () => {
	test('card scan reveals amount input + Dobít button', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/admin/charge');
		await scanCard(asPowerSalesman, memberUser.name);
		await expect(asPowerSalesman.getByLabel('Částka')).toBeVisible();
		await expect(asPowerSalesman.getByRole('button', { name: 'Dobít' })).toBeVisible();
	});

	test('charge with predefined amount fires the deposit and clears the form', async ({
		asPowerSalesman,
	}) => {
		await asPowerSalesman.goto('/admin/charge');
		await scanCard(asPowerSalesman, memberUser.name);
		// Click a predefined-amount preset (500 Kč) and confirm.
		await asPowerSalesman.getByRole('button', { name: '500 Kč', exact: true }).click();
		const depositResp = asPowerSalesman.waitForResponse(
			r => r.url().includes('/transactions/deposit') && r.ok(),
		);
		await asPowerSalesman.getByRole('button', { name: 'Dobít' }).click();
		await depositResp;
		// After submit the card-loader is shown again (cardId reset to null
		// in submit()) — assert the amount input is gone.
		await expect(asPowerSalesman.getByLabel('Částka')).toBeHidden();
	});

	test('charge with manual amount entry submits the value typed', async ({
		asPowerSalesman,
	}) => {
		await asPowerSalesman.goto('/admin/charge');
		await scanCard(asPowerSalesman, memberUser.name);
		await asPowerSalesman.getByLabel('Částka').fill('123');
		const depositResp = asPowerSalesman.waitForRequest(
			r => r.url().includes('/transactions/deposit') && r.method() === 'POST',
		);
		await asPowerSalesman.getByRole('button', { name: 'Dobít' }).click();
		const req = await depositResp;
		const body = req.postDataJSON();
		// Mock contract: deposit reads body.records[].amount
		const total = (body?.records ?? []).reduce(
			(s: number, r: { amount: number }) => s + Number(r.amount ?? 0),
			0,
		);
		expect(total).toBe(123);
	});

	test('Dobít with cardId=null is hidden until card is scanned', async ({
		asPowerSalesman,
	}) => {
		await asPowerSalesman.goto('/admin/charge');
		// Before scan, the form is gated; only the card-loader is visible.
		await expect(asPowerSalesman.getByLabel('Částka')).toBeHidden();
		await expect(asPowerSalesman.getByRole('button', { name: 'Dobít' })).toBeHidden();
	});
});
