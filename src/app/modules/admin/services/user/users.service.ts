import {Injectable} from '@angular/core';
import {EUserRole, IUser} from '../../../../common/types/IUser';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';

@Injectable({
	providedIn: 'root'
})
export class UsersService {
	protected users: IUser[];
	protected limit = 5;

	constructor() {
		// Create 100 users
		this.users = Array.from({length: 100}, (_, k) => this.createNewUser(k + 1));
	}

	public async getUsers(search: string = '', page: number = 1, limit = this.limit): Promise<IPaginatedResponse<IUser>> {
		const params = {
			offset: (page - 1) * this.limit,
			limit: limit,
		};
		let data = this.users.slice(params.offset, params.offset + params.limit)
		if (search !== '') {
			data = data.filter((item) => (item.name.toLowerCase()).includes(search.toLowerCase()) || (item.id.toString()).includes(search))
		}

		return {
			total: this.users.length,
			offset: params.offset,
			limit: params.limit,
			data: data,
		};
	}

	public async editUser(user: IUser): Promise<void> {
		let u = this.users.find((u) => u.id === user.id);
		if(u) {
			u = user;
		}
	}

	protected createNewUser(id: number): IUser {
		const name =
			NAMES[Math.round(Math.random() * (NAMES.length - 1))] +
			' ' +
			NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) +
			'.';

		return {
			id: id,
			name: name,
			credit: 100,
			role: EUserRole.VISITOR
		};
	}
}


const NAMES: string[] = [
	'Maia',
	'Asher',
	'Olivia',
	'Atticus',
	'Amelia',
	'Jack',
	'Charlotte',
	'Theodore',
	'Isla',
	'Oliver',
	'Isabella',
	'Jasper',
	'Cora',
	'Levi',
	'Violet',
	'Arthur',
	'Mia',
	'Thomas',
	'Elizabeth',
];

