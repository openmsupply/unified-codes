import * as React from 'react';

import {
  IUserCredentials,
  KeyCloakIdentityProvider,
  AuthenticationService,
  User,
  JWTToken,
} from '@unified-codes/data/v1';

import { LoginComponent } from './Login';

export default { title: 'Login' };

export const withNoProps = () => {
  return <LoginComponent />;
};

export const withMockOnLoginProp = () => {
  const onLogin = (credentials: IUserCredentials) =>
    alert(`${credentials.username}:${credentials.password}`);
  return <LoginComponent onLogin={onLogin} />;
};

export const withKeycloakOnLoginProp = () => {
  const identityProviderConfig = {
    baseUrl:
      `${process.env.NX_AUTHENTICATION_SERVICE_URL}:${process.env.NX_AUTHENTICATION_SERVICE_PORT}/${process.env.NX_AUTHENTICATION_SERVICE_REALM}/${process.env.NX_AUTHENTICATION_SERVICE_AUTH}` ||
      '',
    clientId: process.env.NX_AUTHENTICATION_SERVICE_CLIENT_ID || '',
    clientSecret: process.env.NX_AUTHENTICATION_SERVICE_CLIENT_SECRET || '',
    grantType: process.env.NX_AUTHENTICATION_SERVICE_GRANT_TYPE || '',
  };

  const identityProvider = new KeyCloakIdentityProvider(identityProviderConfig);
  const authenticator = new AuthenticationService(identityProvider);

  const onLogin = async (credentials: IUserCredentials) => {
    const user: User = await authenticator.login(credentials);
    const token: JWTToken = user.token;
    alert(token.toString());
  };

  return <LoginComponent onLogin={onLogin} />;
};
