export interface IPaginatedResponse<T> {
	count: number; // total count of items
	data: T[];
}
