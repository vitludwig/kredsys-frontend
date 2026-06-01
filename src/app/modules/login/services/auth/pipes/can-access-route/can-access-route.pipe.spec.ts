import {CanAccessRoutePipe} from './can-access-route.pipe';
import {EUserRole} from '../../../../../../common/types/IUser';
import {ERoute} from '../../../../../../common/types/ERoute';

describe('CanAccessRoutePipe', () => {
	let pipe: CanAccessRoutePipe;

	beforeEach(() => {
		pipe = new CanAccessRoutePipe();
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('returns false when roles are missing', () => {
		expect(pipe.transform(undefined, ERoute.SALE)).toBe(false);
	});

	it('allows a route the user role is permitted', () => {
		expect(pipe.transform([EUserRole.WORKER], ERoute.SALE)).toBe(true);
	});

	it('denies a route the user role is not permitted', () => {
		expect(pipe.transform([EUserRole.WORKER], ERoute.ADMIN_PLACES)).toBe(false);
	});

	it('grants PowerSalesman places but not e.g. transactions', () => {
		expect(pipe.transform([EUserRole.POWER_SALESMAN], ERoute.ADMIN_PLACES)).toBe(true);
		expect(pipe.transform([EUserRole.POWER_SALESMAN], ERoute.ADMIN_TRANSACTIONS)).toBe(false);
	});
});
