export type EnumHashMap<TKey extends string | number | symbol, TValue> = {
	[key in TKey]: TValue;
};
