import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { addToBasket, scanCard } from '../../support/pos';
import { goods } from '../../fixtures/data/goods';
import { expiredCardUser, memberUser } from '../../fixtures/data';

const beerGoods = goods.filter(g => g.placeId === 1).find(g => g.name === 'Pivo 0,5l')!; // 50 Kč

test.describe('Sale — expired chip', () => {
	test('scanning an expired chip shows the disabled sidebar overlay', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, expiredCardUser.name);
		await expect(asWorker.getByTestId(SEL.pos.expiredOverlay)).toBeVisible();
		await expect(asWorker.getByTestId(SEL.pos.expiredOverlay)).toContainText('expirovaný');
	});

	test('payment submit stays disabled for an expired chip even with items', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, expiredCardUser.name);
		// Edita has 300 Kč, so a 50 Kč beer would normally enable the submit —
		// it stays disabled purely because the chip is expired.
		await addToBasket(asWorker, beerGoods.id);
		await expect(asWorker.getByTestId(SEL.pos.submit)).toBeDisabled();
	});

	test('a valid chip shows no expired overlay and an enabled flow', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, memberUser.name);
		await expect(asWorker.getByTestId(SEL.pos.expiredOverlay)).toBeHidden();
		await addToBasket(asWorker, beerGoods.id);
		await expect(asWorker.getByTestId(SEL.pos.submit)).toBeEnabled();
	});
});

test.describe('Sale — expired chip top-menu (PowerSalesman)', () => {
	test('Dobít (deposit) is disabled but Vybít (withdraw) stays enabled', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await scanCard(asPowerSalesman, expiredCardUser.name);
		await expect(asPowerSalesman.getByRole('button', { name: /Dobít/i }).first()).toBeDisabled();
		await expect(asPowerSalesman.getByRole('button', { name: /Vybít/i }).first()).toBeEnabled();
	});
});
