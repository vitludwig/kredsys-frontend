export enum ETime {
	SECOND = 1000,
	MINUTE = 60 * ETime.SECOND,
	HOUR = 60 * ETime.MINUTE,
	DAY = 24 * ETime.HOUR,
	WEEK = 7 * ETime.DAY,
}
