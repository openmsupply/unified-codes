import * as React from 'react';

import { IUserCredentials } from '@unified-codes/data/v1';

import Button from '../atoms/Button';
import Grid from '../../layout/atoms/Grid';
import LoginInput from '../molecules/LoginInput';
import Typography from '../../data/atoms/Typography';

export interface LoginFormProps {
  onSubmit?: (credentials: IUserCredentials) => void;
}

export type LoginForm = React.FunctionComponent<LoginFormProps>;

export const LoginForm: LoginForm = ({ onSubmit }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const onChange = React.useCallback(({ username, password }) => {
    setUsername(username);
    setPassword(password);
  }, []);

  const onClick = React.useCallback(() => {
    if (!onSubmit) return null;
    const credentials: IUserCredentials = { username, password };
    onSubmit(credentials);
  }, [username, password, onSubmit]);

  return (
    <Grid>
      <Grid item>
        <Typography align="center" display="block" variant="button">
          Login
        </Typography>
      </Grid>
      <Grid container direction="column" spacing={3} alignItems="stretch">
        <Grid item>
          <LoginInput username={username} password={password} onChange={onChange} />
        </Grid>
        <Grid item>
          <Button fullWidth onClick={onClick}>
            Submit
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default LoginForm;
