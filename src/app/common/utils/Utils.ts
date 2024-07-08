import {HashMap} from '../types/HashMap';
import {IUser} from '../types/IUser';

export class Utils {
	/**
	 * make object of data indexed by key
	 * BEWARE: you need to use pipe 'keyvalue' if you want to iterate over returned array in template!
	 *
	 * @param data
	 * @param indexBy
	 */
	// TODO: rewrite to Record instead of HashMap
	public static toHashMap<T>(data: any[], indexBy: string): HashMap<T> {
		const result: HashMap<T> = {};
		for(const obj of data) {
			if(obj[indexBy]) {
				result[obj[indexBy]] = obj;
			}
		}
		return result;
	}

	/**
	 * Map common properties from source object to target object
	 *
	 * @param targetObject
	 * @param sourceObject
	 */
	public static mapValues<T extends object, S extends T>(targetObject: T, sourceObject: S): T {
		const newObject = Object.assign({}, targetObject);

		Object.entries(newObject).map(([key, value]) => {
			if(sourceObject[key as keyof T]) {
				newObject[key as keyof T] = sourceObject[key as keyof T];
			}
		});

		return newObject;
	}

	public static createWalletHash(input: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(input);

		return crypto.subtle.digest('SHA-256', data)
			.then(hashBuffer => {
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
				return hashHex.substr(0, 6).toUpperCase();
			});
	}
}
