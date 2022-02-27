export interface IPaginatedResponse<T> {
	limit: number;
	offset: number;
	total: number;
	data: T[];
}
