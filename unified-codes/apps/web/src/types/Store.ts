import { Entity, IAlert, IExplorerVariables, IUser } from '@unified-codes/data';

export type IAlertState = IAlert | {};

export interface IAuthenticatorState {
  isAuthenticating?: boolean;
}

export type IExplorerData = {
  cursor?: string;
  hasMore: boolean;
  totalResults: number;
  data: Entity[];
};

export interface IExplorerState {
  entities?: IExplorerData;
  error?: Error;
  loading?: boolean;
  variables?: IExplorerVariables;
}

export type IUserState = IUser | {};

export interface IState {
  alert: IAlertState;
  user: IUserState;
  explorer: IExplorerState;
  authenticator: IAuthenticatorState;
}
