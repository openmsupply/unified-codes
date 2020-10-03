import { IAlert, IUser, EEntityField, IEntity, EEntityType } from '@unified-codes/data';

export type IAlertState = IAlert | {};

export interface IAuthenticatorState {
  isAuthenticating?: boolean;
}

export interface IExplorerSearchBarState {
  input: string;
  filterBy: EEntityField;
}

export interface IExplorerTableState {
  count: number;
  loading: boolean;
  orderBy: EEntityField;
  orderDesc: boolean;
  rowsPerPage: number;
  page: number;
  entities: IEntity[];
}

export interface IExplorerToggleBarState {
  [EEntityType.DRUG]: boolean,
  [EEntityType.MEDICINAL_PRODUCT]: boolean,
  [EEntityType.OTHER]: boolean,
}

export interface IExplorerState {
  searchBar: IExplorerSearchBarState;
  table: IExplorerTableState;
  toggleBar: IExplorerToggleBarState;
}

export type IUserState = IUser | {};


export interface IState {
  alert: IAlertState;
  user: IUserState;
  explorer: IExplorerState;
  authenticator: IAuthenticatorState;
}

