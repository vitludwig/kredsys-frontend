export interface IGroup {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface IGroupCreate extends Omit<IGroup, 'id'> {}
