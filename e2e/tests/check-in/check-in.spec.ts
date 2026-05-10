import { test, expect } from '../../support/personas';
import { scanNewCard } from '../../support/pos';
import { ALERT, SEL } from '../../support/selectors';
import { janaUser } from '../../fixtures/data/users';

const CI = SEL.checkIn;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function scanAndFillBasic(page: Parameters<typeof scanNewCard>[0], uid: number) {
	await page.goto('/check-in');
	await scanNewCard(page, uid);
	await page.getByTestId(CI.memberId).fill('55555');
	await page.getByTestId(CI.name).fill('e2e Test User');
	await page.getByTestId(CI.email).fill('e2e-test@test.cz');
}

// ---------------------------------------------------------------------------
// Gate / visibility
// ---------------------------------------------------------------------------

test.describe('Check-in — gate', () => {
	test('form is gated until a new card is scanned', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await expect(asPowerSalesman.getByTestId(CI.memberId)).toBeHidden();
	});

	test('scanning a new card reveals the registration form', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_321_098_765);
		await expect(asPowerSalesman.getByTestId(CI.memberId)).toBeVisible();
		await expect(asPowerSalesman.getByTestId(CI.name)).toBeVisible();
		await expect(asPowerSalesman.getByTestId(CI.email)).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test.describe('Check-in — reset', () => {
	test('reset button hides the form and re-shows the card loader', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_000_000_001);
		await expect(asPowerSalesman.getByTestId(CI.submit)).toBeVisible();

		await asPowerSalesman.getByTestId(CI.reset).click();

		await expect(asPowerSalesman.getByTestId(CI.memberId)).toBeHidden();
		await expect(asPowerSalesman.getByTestId(SEL.cardLoader.newCard)).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test.describe('Check-in — validation', () => {
	test('submit is disabled until required fields are filled', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_321_098_766);
		await expect(asPowerSalesman.getByTestId(CI.submit)).toBeDisabled();
		await asPowerSalesman.getByTestId(CI.memberId).fill('77777');
		await asPowerSalesman.getByTestId(CI.name).fill('e2e-CheckedIn User');
		await asPowerSalesman.getByTestId(CI.email).fill('e2e-checkin@test.cz');
		await expect(asPowerSalesman.getByTestId(CI.submit)).toBeEnabled();
	});

	test('invalid email format keeps submit disabled', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_000_000_002);
		await asPowerSalesman.getByTestId(CI.memberId).fill('44444');
		await asPowerSalesman.getByTestId(CI.name).fill('e2e-BadEmail');
		await asPowerSalesman.getByTestId(CI.email).fill('not-an-email');
		await expect(asPowerSalesman.getByTestId(CI.submit)).toBeDisabled();
	});

	test('deposit over 50000 shows a business-rule error', async ({ asPowerSalesman }) => {
		await scanAndFillBasic(asPowerSalesman, 4_000_000_003);
		await asPowerSalesman.getByTestId(CI.deposit).fill('50001');
		await asPowerSalesman.getByTestId(CI.submit).click();
		await expect(asPowerSalesman.locator('.alert-danger')).toContainText('50000');
	});
});

// ---------------------------------------------------------------------------
// New-user registration (POST flow)
// ---------------------------------------------------------------------------

test.describe('Check-in — new user registration', () => {
	test('full registration flow creates the user', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_321_098_767);
		await asPowerSalesman.getByTestId(CI.memberId).fill('88888');
		await asPowerSalesman.getByTestId(CI.name).fill('e2e-Register Test');
		await asPowerSalesman.getByTestId(CI.email).fill('e2e-register@test.cz');
		const usersPost = asPowerSalesman.waitForResponse(
			r => /\/users$/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
		);
		await asPowerSalesman.getByTestId(CI.submit).click();
		await usersPost;
	});

	test('successful registration shows a success snackbar', async ({ asPowerSalesman }) => {
		await scanAndFillBasic(asPowerSalesman, 4_000_000_004);
		await asPowerSalesman.getByTestId(CI.submit).click();
		await expect(asPowerSalesman.locator(ALERT.success)).toBeVisible();
	});

	test('successful registration resets the form to card-scan state', async ({ asPowerSalesman }) => {
		await scanAndFillBasic(asPowerSalesman, 4_000_000_005);
		await asPowerSalesman.getByTestId(CI.submit).click();
		await expect(asPowerSalesman.locator(ALERT.success)).toBeVisible();
		await expect(asPowerSalesman.getByTestId(CI.memberId)).toBeHidden();
		await expect(asPowerSalesman.getByTestId(SEL.cardLoader.newCard)).toBeVisible();
	});

	test('registration with initial deposit calls the deposit API', async ({ asPowerSalesman }) => {
		await scanAndFillBasic(asPowerSalesman, 4_000_000_006);
		await asPowerSalesman.getByTestId(CI.deposit).fill('200');
		const depositCall = asPowerSalesman.waitForResponse(
			r => /\/deposit$/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
		);
		await asPowerSalesman.getByTestId(CI.submit).click();
		await depositCall;
	});

	test('409 conflict shows a user-friendly duplicate error', async ({ asPowerSalesman, mockApi }, testInfo) => {
		testInfo.annotations.push({ type: 'allow-console-errors' });
		mockApi!.override('POST', /^users$/, () => ({ status: 409, body: {} }));
		await scanAndFillBasic(asPowerSalesman, 4_000_000_007);
		await asPowerSalesman.getByTestId(CI.submit).click();
		await expect(asPowerSalesman.locator('.alert-danger')).toContainText('již existuje');
	});
});

// ---------------------------------------------------------------------------
// Search and select existing user (PUT flow)
// ---------------------------------------------------------------------------

test.describe('Check-in — existing user', () => {
	test('search returns matching users', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_000_000_010);

		await asPowerSalesman.getByTestId(CI.search).fill('Jana');
		await expect(
			asPowerSalesman.getByTestId(CI.userResult(janaUser.id)),
		).toBeVisible();
	});

	test('selecting a user from search prefills the form with their data', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_000_000_011);

		await asPowerSalesman.getByTestId(CI.search).fill('Jana');
		await asPowerSalesman.getByTestId(CI.userResult(janaUser.id)).click();

		await expect(asPowerSalesman.getByTestId(CI.name)).toHaveValue(janaUser.name);
		await expect(asPowerSalesman.getByTestId(CI.email)).toHaveValue(janaUser.email);
		await expect(asPowerSalesman.getByTestId(CI.memberId)).toHaveValue(String(janaUser.memberId));
	});

	test('submitting after selecting from list sends PUT instead of POST', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_000_000_012);

		await asPowerSalesman.getByTestId(CI.search).fill('Jana');
		await asPowerSalesman.getByTestId(CI.userResult(janaUser.id)).click();

		const usersPut = asPowerSalesman.waitForResponse(
			r => /\/users\/\d+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
		);
		await asPowerSalesman.getByTestId(CI.submit).click();
		await usersPut;
	});

	test('selecting a user clears the search field', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_000_000_013);

		await asPowerSalesman.getByTestId(CI.search).fill('Jana');
		await asPowerSalesman.getByTestId(CI.userResult(janaUser.id)).click();

		await expect(asPowerSalesman.getByTestId(CI.search)).toHaveValue('');
	});

	test('search with no results shows an empty state message', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_000_000_014);

		await asPowerSalesman.getByTestId(CI.search).fill('xyznonexistent');
		await expect(asPowerSalesman.getByText('Žádní uživatele')).toBeVisible();
	});
});
