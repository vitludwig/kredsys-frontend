export interface FixtureUserGroup {
	userId: number;
	groupId: number;
}

export const userGroups: FixtureUserGroup[] = [
	{ userId: 4, groupId: 1 },
	{ userId: 5, groupId: 1 },
	{ userId: 5, groupId: 2 },
	{ userId: 8, groupId: 2 },
	{ userId: 9, groupId: 3 },
];
