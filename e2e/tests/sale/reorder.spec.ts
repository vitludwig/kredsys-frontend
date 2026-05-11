import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { scanCard } from '../../support/pos';
import { goods } from '../../fixtures/data';
import { memberUser } from '../../fixtures/data';

const UI = SEL.pos;

const place1Goods = goods.filter(g => g.placeId === 1);
// First two tiles on place 1 (by fixture order) — used for drag assertions.
const item1 = place1Goods[0]; // Pivo 0,5l  id:1
const item2 = place1Goods[1]; // Víno 0,2l  id:2

// CDK drag-drop needs incremental mouse events and a small delay after mousedown
// for it to cross its 5px start threshold and register the drop list entry.
async function dragTile(page: Page, source: Locator, target: Locator): Promise<void> {
	const src = await source.boundingBox();
	const dst = await target.boundingBox();
	if (!src || !dst) throw new Error('Tile bounding box not found');
	const sx = src.x + src.width / 2;
	const sy = src.y + src.height / 2;
	const dx = dst.x + dst.width / 2;
	const dy = dst.y + dst.height / 2;

	await page.mouse.move(sx, sy);
	await page.mouse.down();
	// Small initial nudge to cross CDK's dragStartThreshold (5 px default).
	await page.mouse.move(sx + 6, sy, { steps: 3 });
	// Glide to the destination in multiple steps so CDK can track position.
	await page.mouse.move(dx, dy, { steps: 20 });
	await page.mouse.up();
}

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

test.describe('Sale / reorder — authorization', () => {
	test('reorder toggle is visible for power salesman', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await expect(asPowerSalesman.getByTestId(UI.reorderToggle)).toBeVisible();
	});

	test('reorder toggle is not visible for worker', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await expect(asWorker.getByTestId(UI.reorderToggle)).not.toBeAttached();
	});
});

// ---------------------------------------------------------------------------
// Mode toggle
// ---------------------------------------------------------------------------

test.describe('Sale / reorder — mode toggle', () => {
	test('clicking the lock button enters reorder mode and shows the overlay', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await expect(asPowerSalesman.getByTestId(UI.reorderOverlay)).not.toBeAttached();
		await asPowerSalesman.getByTestId(UI.reorderToggle).click();
		await expect(asPowerSalesman.getByTestId(UI.reorderOverlay)).toBeVisible();
		await expect(asPowerSalesman.getByTestId(UI.reorderOverlay)).toContainText('Režim editace pořadí');
	});

	test('clicking the overlay exit button leaves reorder mode', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await asPowerSalesman.getByTestId(UI.reorderToggle).click();
		await expect(asPowerSalesman.getByTestId(UI.reorderOverlay)).toBeVisible();
		await asPowerSalesman.getByTestId(UI.reorderExit).click();
		await expect(asPowerSalesman.getByTestId(UI.reorderOverlay)).not.toBeAttached();
	});

	test('filter panel is hidden in reorder mode and restored after exit', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		// Filter panel is visible by default (at least one type button renders).
		const filterBtn = asPowerSalesman.getByTestId(UI.filter(place1Goods[0].goodsTypeId!));
		await expect(filterBtn).toBeVisible();

		await asPowerSalesman.getByTestId(UI.reorderToggle).click();
		await expect(filterBtn).not.toBeAttached();

		await asPowerSalesman.getByTestId(UI.reorderExit).click();
		await expect(filterBtn).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Interaction guard
// ---------------------------------------------------------------------------

test.describe('Sale / reorder — interaction guard', () => {
	test('clicking a tile in reorder mode does not add it to the basket', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await scanCard(asPowerSalesman, memberUser.name);
		await asPowerSalesman.getByTestId(UI.reorderToggle).click();

		await asPowerSalesman.getByTestId(UI.goodsTile(item1.id)).click();
		// Basket item must not appear — clicks are swallowed in reorder mode.
		await expect(asPowerSalesman.getByTestId(UI.basketItem(item1.id))).not.toBeAttached();
	});
});

// ---------------------------------------------------------------------------
// Drag reorder
// ---------------------------------------------------------------------------

test.describe('Sale / reorder — drag', () => {
	test('dragging item1 onto item2 calls PATCH /goods/move', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await asPowerSalesman.getByTestId(UI.reorderToggle).click();

		const moveReq = asPowerSalesman.waitForResponse(
			r => r.url().includes('/goods/move') && r.request().method() === 'PATCH' && r.ok(),
		);
		await dragTile(asPowerSalesman, asPowerSalesman.getByTestId(UI.goodsTile(item1.id)), asPowerSalesman.getByTestId(UI.goodsTile(item2.id)));
		await moveReq;
	});

	test('PATCH body contains the reordered IDs', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await asPowerSalesman.getByTestId(UI.reorderToggle).click();

		let requestBody: number[] = [];
		const moveReq = asPowerSalesman.waitForResponse(async r => {
			if (!r.url().includes('/goods/move') || r.request().method() !== 'PATCH') return false;
			requestBody = await r.request().postDataJSON();
			return r.ok();
		});
		await dragTile(asPowerSalesman, asPowerSalesman.getByTestId(UI.goodsTile(item1.id)), asPowerSalesman.getByTestId(UI.goodsTile(item2.id)));
		await moveReq;

		// After moving item1 after item2, item2's id should precede item1's id.
		const i1 = requestBody.indexOf(item1.id);
		const i2 = requestBody.indexOf(item2.id);
		expect(i1).toBeGreaterThan(-1);
		expect(i2).toBeGreaterThan(-1);
		expect(i2).toBeLessThan(i1);
	});

	test('after drag, tile order in DOM reflects the new position', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/sale');
		await asPowerSalesman.getByTestId(UI.reorderToggle).click();

		const moveReq = asPowerSalesman.waitForResponse(
			r => r.url().includes('/goods/move') && r.request().method() === 'PATCH' && r.ok(),
		);
		await dragTile(asPowerSalesman, asPowerSalesman.getByTestId(UI.goodsTile(item1.id)), asPowerSalesman.getByTestId(UI.goodsTile(item2.id)));
		await moveReq;

		// Tiles in DOM order after the drop.
		const tiles = asPowerSalesman.locator('[data-testid^="goods-tile-"]');
		const firstTileId = await tiles.first().getAttribute('data-testid');
		const secondTileId = await tiles.nth(1).getAttribute('data-testid');

		// item2 should now be first, item1 second.
		expect(firstTileId).toBe(`goods-tile-${item2.id}`);
		expect(secondTileId).toBe(`goods-tile-${item1.id}`);
	});

	test('toggle button is disabled and spinner shown while saving', async ({ asPowerSalesman, mockApi }) => {
		// Only testable in mock mode — we need to delay the PATCH response.
		test.skip(!mockApi, 'requires mock mode');

		// Delay the PATCH response by 500 ms to open a window for assertions.
		mockApi!.override('PATCH', /goods\/move/, async () => {
			await new Promise<void>(r => setTimeout(r, 500));
			return { status: 200, body: null };
		});

		await asPowerSalesman.goto('/sale');
		await asPowerSalesman.getByTestId(UI.reorderToggle).click();

		// dragTile() returns after mouseup; the PATCH is now in-flight.
		await dragTile(
			asPowerSalesman,
			asPowerSalesman.getByTestId(UI.goodsTile(item1.id)),
			asPowerSalesman.getByTestId(UI.goodsTile(item2.id)),
		);

		// Spinner should be visible and toggle disabled while PATCH is pending.
		await expect(asPowerSalesman.getByTestId('reorder-saving-spinner')).toBeVisible();
		await expect(asPowerSalesman.getByTestId(UI.reorderToggle)).toBeDisabled();

		// Spinner disappears once PATCH resolves.
		await asPowerSalesman.waitForSelector('[data-testid="reorder-saving-spinner"]', { state: 'detached' });
	});
});
