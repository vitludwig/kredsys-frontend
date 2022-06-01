import {HashMap} from '../types/HashMap';

export class Utils {
	/**
	 * make object of data indexed by key
	 * BEWARE: you need to use pipe 'keyvalue' if you want to iterate over returned array in template!
	 *
	 * @param data
	 * @param indexBy
	 */
	public static toHashMap<T>(data: any[], indexBy: string): HashMap<T> {
		const result: HashMap<T> = {};
		for(const obj of data) {
			if(obj[indexBy]) {
				result[obj[indexBy]] = obj;
			}
		}
		return result;
	}
}
