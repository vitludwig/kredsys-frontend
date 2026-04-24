import {CanAccessRoutePipe} from './can-access-route.pipe';
import {PlaceService} from '../../../../../admin/services/place/place/place.service';

describe('CanAccessRoutePipe', () => {
	it('create an instance', () => {
		const mockPlaceService = {} as PlaceService;
		const pipe = new CanAccessRoutePipe(mockPlaceService);
		expect(pipe).toBeTruthy();
	});
});
