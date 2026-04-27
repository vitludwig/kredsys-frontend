import { test, expect } from '../../support/personas';
import { scanNewCard } from '../../support/pos';

test.describe('Check-in', () => {
	test('form is gated until a new card is scanned', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		// Form fields are inside [hidden]="!newCard" block — invisible before scan.
		await expect(asPowerSalesman.getByTestId('checkin-member-id')).toBeHidden();
	});

	test('scanning a new card reveals the registration form', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_321_098_765);
		await expect(asPowerSalesman.getByTestId('checkin-member-id')).toBeVisible();
		await expect(asPowerSalesman.getByTestId('checkin-name')).toBeVisible();
		await expect(asPowerSalesman.getByTestId('checkin-email')).toBeVisible();
	});

	test('submit disabled until required fields are filled', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_321_098_766);
		await expect(asPowerSalesman.getByTestId('checkin-submit')).toBeDisabled();
		await asPowerSalesman.getByTestId('checkin-member-id').fill('77777');
		await asPowerSalesman.getByTestId('checkin-name').fill('e2e-CheckedIn User');
		await asPowerSalesman.getByTestId('checkin-email').fill('e2e-checkin@test.cz');
		await expect(asPowerSalesman.getByTestId('checkin-submit')).toBeEnabled();
	});

	test('full registration flow creates the user', async ({ asPowerSalesman }) => {
		await asPowerSalesman.goto('/check-in');
		await scanNewCard(asPowerSalesman, 4_321_098_767);
		await asPowerSalesman.getByTestId('checkin-member-id').fill('88888');
		await asPowerSalesman.getByTestId('checkin-name').fill('e2e-Register Test');
		await asPowerSalesman.getByTestId('checkin-email').fill('e2e-register@test.cz');
		const usersPost = asPowerSalesman.waitForResponse(
			r => /\/users$/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
		);
		await asPowerSalesman.getByTestId('checkin-submit').click();
		await usersPost;
	});
});
