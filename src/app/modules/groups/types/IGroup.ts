export interface IGroup {
	id: number;
	name: string;
	description: string;
	color: string;
	// Provided only by the list endpoint (GET /groups); absent on getGroup(id) and stats payloads.
	memberCount?: number;
}

export interface IGroupCreate extends Omit<IGroup, 'id' | 'memberCount'> {}
