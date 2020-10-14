import * as React from 'react';
import { batch, connect } from 'react-redux';

import { EntityBrowser } from '@unified-codes/ui';

import ExplorerTable from './ExplorerTable';
import ExplorerToggleBar from './ExplorerToggleBar';
import ExplorerSearchBar from './ExplorerSearchBar';

import { withStyles } from '../../styles';
import { IState, ITheme } from '../../types';
import { ExplorerActions, IExplorerAction } from '../../actions';
import { ExplorerSelectors } from '../../selectors';

const styles = (theme: ITheme) => ({
  root: {
    width: '100%',
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  tableContainer: {
    backgroundColor: theme.palette.background.default,
    margin: '0 auto 0 auto',
    maxHeight: '100%',
    maxWidth: 900,
    width: '60%',
    borderRadius: 5,
  },
  searchBarContainer: {
    backgroundColor: theme.palette.background.default,
    margin: '-20px auto 0 auto',
    maxWidth: 900,
    width: '60%',
    borderRadius: 5,
  },
  toggleBarContainer: {
    backgroundColor: theme.palette.background.footer,
    paddingBottom: 24,
  },
});

const mapDispatchToProps = (dispatch: React.Dispatch<IExplorerAction>) => {
  const onMount = () => dispatch(ExplorerActions.updateEntities());
  const onUnmount = () => {
    batch(() => {
      dispatch(ExplorerActions.resetEntities());
      dispatch(ExplorerActions.resetFilterBy());
      dispatch(ExplorerActions.resetInput());
      dispatch(ExplorerActions.resetOrderBy());
      dispatch(ExplorerActions.resetOrderDesc());
      dispatch(ExplorerActions.resetPage());
      dispatch(ExplorerActions.resetRowsPerPage());
    });
  };

  return { onMount, onUnmount };
};

const mapStateToProps = (state: IState) => {
  const table = <ExplorerTable />;
  const toggleBar = <ExplorerToggleBar />;
  const searchBar = <ExplorerSearchBar />;
  const loading = ExplorerSelectors.selectLoading(state);

  return { loading, table, toggleBar, searchBar };
};

export const ExplorerBrowser = connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(EntityBrowser));

export default ExplorerBrowser;
