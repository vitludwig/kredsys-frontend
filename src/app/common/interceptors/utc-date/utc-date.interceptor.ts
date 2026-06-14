import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

const ISO_WITHOUT_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

/**
 * The API serializes UTC timestamps without a zone suffix, so the native `date`
 * pipe parses them as browser-local time (~2 h off in CET/CEST). This tags every
 * such string in JSON responses with `Z`, fixing display globally with no per-template pipe.
 */
export const utcDateInterceptor: HttpInterceptorFn = (req, next) =>
	next(req).pipe(
		map((event) =>
			event instanceof HttpResponse && event.body != null
				? event.clone({ body: tagUtc(event.body) })
				: event,
		),
	);

function tagUtc(value: unknown): unknown {
	if (typeof value === 'string') return tagUtcTimestamp(value);
	if (Array.isArray(value)) return value.map(tagUtc);
	if (isPlainObject(value)) return mapValues(value, tagUtc);
	return value;
}

function tagUtcTimestamp(value: string): string {
	if (!ISO_WITHOUT_ZONE.test(value)) return value;
	const utc = `${value}Z`;
	return isValidDate(utc) ? utc : value;
}

function isValidDate(value: string): boolean {
	return !Number.isNaN(new Date(value).getTime());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

function mapValues(obj: Record<string, unknown>, fn: (value: unknown) => unknown): Record<string, unknown> {
	return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]));
}
