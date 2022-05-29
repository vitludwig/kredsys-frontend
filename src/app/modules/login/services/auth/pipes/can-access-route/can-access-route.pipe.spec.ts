import { CanAccessRoutePipe } from './is-route-allowed.pipe';

describe('IsRouteAllowedPipe', () => {
  it('create an instance', () => {
    const pipe = new CanAccessRoutePipe();
    expect(pipe).toBeTruthy();
  });
});
