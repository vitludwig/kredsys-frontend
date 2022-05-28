/**
 * This decorator create method which do only first request for data and others cache -
 * save to queue and resolve it after receiving data. After first success data fetch it
 * return immediately resolved promise. Cached values are only for duplicate arguments which
 * are passed to dataGetter function.
 *
 * @param [cacheTimeout=60000] Cached data maximal age in milliseconds. Default is 60 seconds.
 * @param [tags=[]] Array og tags used for invalidation by invalidateCache annotation
 */
import {TAnyFunction} from '../types/TAnyFunction';
import {HashMap} from '../types/HashMap';


export function cache(cacheTimeout: number = 60000, tags: string[] = []): (target: any, keyName: string, descriptor: TypedPropertyDescriptor<any>) => any {
	return function(target: any, keyName: string, descriptor: TypedPropertyDescriptor<any>): any {
		return {
			value: createCacher(descriptor.value, cacheTimeout, tags),
		};
	};
}

export function invalidateCache(tags: string[]): (target: any, keyName: string, descriptor: TypedPropertyDescriptor<any>) => any {
	return function(target: any, keyName: string, descriptor: TypedPropertyDescriptor<any>): any {
		return {
			value: function(...args: any[]): any {
				
				const result = descriptor.value.apply(this, args);
				
				// Invalidate after Promise is resolved if is returned
				if(typeof result === 'object' && typeof result.then === 'function') {
					result.then((response: any) => {
						manualInvalidate(tags);
						return response;
					});
				} else {
					manualInvalidate(tags);
				}
				
				return result;
			},
		};
	};
};

/**
 * Timestamps with last time of tag invalidation
 */
export const cacheTags: { [key: string]: number } = {};

type Parameters<T> = T extends (...args: infer T) => any ? T : never;
type UnsafeReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

export type TCachedFunction<TFunction extends TAnyFunction> = (...args: Parameters<TFunction>) => Promise<UnsafeReturnType<TFunction>>;

/** TCachedFunction<TFunction>
 * This function create getter which do only first request for data and others cache -
 * save to queue and resolve it after receiving data. After first success data fetch it
 * return immediately resolved promise. Cached values are only for duplicate arguments which
 * are passed to dataGetter function.
 *
 * @param dataGetter Function returning data as Promise or normal data for initial data request. Arguments are passed.
 * @param [cacheTimeout=60000] Cached data maximal age in milliseconds. Default is 60 seconds.
 * @param tags
 *
 * @return Function doing caching and returning Promise
 */
export function createCacher<TFunction extends TAnyFunction>(dataGetter: TFunction, cacheTimeout: number = 60000, tags: string[] = []): TCachedFunction<TFunction> {
	const fetched: HashMap<Date> = {};
	const fetching: HashMap<boolean> = {};
	const resolveArray: HashMap<[resolve: ((result: UnsafeReturnType<TFunction>) => void), reject: (reason?: any) => void][]> = {};
	const fetchTime: HashMap<number> = {};
	
	const result: HashMap<any> = {};
	
	return function(...args: Parameters<TFunction>): Promise<UnsafeReturnType<TFunction>> {
		
		// Create signature by arguments so can decide if is already cached
		const argsSignature = JSON.stringify(args);
		
		// Fetched and not too old?
		if(
			fetched[argsSignature]
			&& fetched[argsSignature].getTime() + cacheTimeout > (new Date()).getTime()
			&& tags.filter((tag) => cacheTags[tag] > fetchTime[argsSignature]).length === 0
		) {
			return Promise.resolve(result[argsSignature]);
		}
		
		// First request - fetch data
		if(!fetching[argsSignature]) {
			fetching[argsSignature] = true;
			resolveArray[argsSignature] = [];
			fetchTime[argsSignature] = new Date().getTime();
			
			// Get data
			// @ts-ignore Suppress `this` type
			const promise: Promise<UnsafeReturnType<TFunction>> | UnsafeReturnType<TFunction> = dataGetter.apply(this, args);
			
			// Save data
			const dataSave = (data: any) => {
				// Save data and cache timestamp
				result[argsSignature] = data;
				fetched[argsSignature] = new Date();
				fetching[argsSignature] = false;
				
				// Resolve other request for data
				for(const key in resolveArray[argsSignature]) {
					resolveArray[argsSignature][key][0](result[argsSignature]);
				}
				
				// Remove cached data after timeout
				setTimeout(() => {
					delete result[argsSignature];
					delete fetched[argsSignature];
					delete fetching[argsSignature];
					delete resolveArray[argsSignature];
				}, cacheTimeout);
				
				return data;
			};
			
			// Does getter return Promise?
			if(promise && typeof (<Promise<UnsafeReturnType<TFunction>>> promise).then === 'function') {
				(<Promise<UnsafeReturnType<TFunction>>> promise)
					.then(dataSave)
					.catch((e: any) => {
						// Fetch fail, so enable new data fetch
						fetching[argsSignature] = false;
						
						// Fire reject on other data requests
						for(const key in resolveArray[argsSignature]) {
							resolveArray[argsSignature][key][1](result[argsSignature]);
						}
					});
				
				return promise;
			}
			
			// Getter doesn't return promise, so create new to return
			return Promise.resolve(dataSave(promise));
			
		}
		
		// Data fetching in progress, so register to queue
		return new Promise((resolve, reject) => {
			resolveArray[argsSignature].push([resolve, reject]);
		});
	};
}

export function manualInvalidate(tags: string[]): void {
	for(const tag of tags) {
		cacheTags[tag] = new Date().getTime();
	}
}
