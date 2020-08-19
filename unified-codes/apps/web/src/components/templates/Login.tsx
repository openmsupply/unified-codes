import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Dialog, DialogContent, LoginForm } from '@unified-codes/ui';
import { AuthenticatorActions, IAuthenticatorAction } from '../../actions';
import { IUserCredentials } from '@unified-codes/data';

export interface LoginProps {
  onLogin?: (credentials: IUserCredentials) => void;
}

export type Login = React.FunctionComponent<LoginProps>;

export const LoginComponent: Login = ({ onLogin = () => null }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const closeDialog = React.useCallback(() => setIsOpen(false), []);
  const onSubmit = React.useCallback((username, password) => {
    if (!onLogin) return;
    const auth = { username, password };
    onLogin(auth);
    closeDialog();
  }, []);

  return (
    <Dialog open={isOpen} onClose={closeDialog}>
      <DialogContent dividers>
        <LoginForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};

const mapDispatchToProps = (dispatch: React.Dispatch<IAuthenticatorAction>) => {
  const onLogin = (credentials: IUserCredentials) => dispatch(AuthenticatorActions.authenticate(credentials));
  return { onLogin };
};

export const Login = connect(null, mapDispatchToProps)(LoginComponent);

export default Login;
