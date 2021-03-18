import * as React from 'react';
import { batch, connect } from 'react-redux';

import { CheckCircleIcon, AddIcon, Grid } from '@unified-codes/ui/components';
import { withStyles } from '@unified-codes/ui/styles';
import { EEntityCategory } from '@unified-codes/data/v1';

import ExplorerToggleButton from './ExplorerToggleButton';

import { ExplorerActions, IExplorerAction } from '../../../actions';
import { ExplorerSelectors } from '../../../selectors';
import { IState } from '../../../types';
import { ITheme } from '../../../styles';

const styles = (_: ITheme) => ({});

export interface ExplorerToggleBarProps {
  classes?: {
    root?: string;
  };
  buttons: React.ReactElement[];
}

export type ExplorerToggleBar = React.FunctionComponent<ExplorerToggleBarProps>;

const ExplorerToggleBarComponent: ExplorerToggleBar = ({ classes, buttons }) => {
  const toggleButtons = buttons.map((button) => (
    <Grid item key={button?.key as React.ReactText}>
      {button}
    </Grid>
  ));

  return (
    <Grid container classes={classes} justify="center" direction="row" spacing={2}>
      {toggleButtons}
    </Grid>
  );
};

const mergeProps = (stateProps: any, dispatchProps: any) => {
  const { filterByDrug, filterByMedicinalProduct, filterByOther } = stateProps;
  const {
    onToggleFilterByDrug,
    onToggleFilterByMedicinalProduct,
    onToggleFilterByOther,
  } = dispatchProps;

  const drugButtonLabel = 'Drug';
  const drugButtonKey = EEntityCategory.DRUG;
  const drugButtonColor = filterByDrug ? 'primary' : 'secondary';
  const drugButtonStartIcon = filterByDrug ? <CheckCircleIcon /> : <AddIcon />;
  const drugButtonOnClick = onToggleFilterByDrug;

  const medicinalProductButtonLabel = 'Medicinal product';
  const medicinalProductButtonKey = EEntityCategory.MEDICINAL_PRODUCT;
  const medicinalProductButtonColor = filterByMedicinalProduct ? 'primary' : 'secondary';
  const medicinalProductButtonStartIcon = filterByMedicinalProduct ? (
    <CheckCircleIcon />
  ) : (
    <AddIcon />
  );
  const medicinalProductButtonOnClick = onToggleFilterByMedicinalProduct;

  const otherButtonLabel = 'Other';
  const otherButtonKey = EEntityCategory.OTHER;
  const otherButtonColor = filterByOther ? 'primary' : 'secondary';
  const otherButtonStartIcon = filterByOther ? <CheckCircleIcon /> : <AddIcon />;
  const otherButtonOnClick = onToggleFilterByOther;

  const ToggleButtonDrug = (
    <ExplorerToggleButton
      key={drugButtonKey}
      startIcon={drugButtonStartIcon}
      color={drugButtonColor}
      onClick={drugButtonOnClick}
    >
      {drugButtonLabel}
    </ExplorerToggleButton>
  );

  const ToggleButtonMedicinalProduct = (
    <ExplorerToggleButton
      key={medicinalProductButtonKey}
      startIcon={medicinalProductButtonStartIcon}
      color={medicinalProductButtonColor}
      onClick={medicinalProductButtonOnClick}
    >
      {medicinalProductButtonLabel}
    </ExplorerToggleButton>
  );

  const ToggleButtonOther = (
    <ExplorerToggleButton
      key={otherButtonKey}
      startIcon={otherButtonStartIcon}
      color={otherButtonColor}
      onClick={otherButtonOnClick}
    >
      {otherButtonLabel}
    </ExplorerToggleButton>
  );

  return { buttons: [ToggleButtonDrug, ToggleButtonMedicinalProduct, ToggleButtonOther] };
};

const mapDispatchToProps = (dispatch: React.Dispatch<IExplorerAction>) => {
  const onToggleFilterByDrug = () =>
    batch(() => {
      dispatch(ExplorerActions.resetPage());
      dispatch(ExplorerActions.toggleFilterByDrug());
      dispatch(ExplorerActions.updateEntities());
    });

  const onToggleFilterByMedicinalProduct = () =>
    batch(() => {
      dispatch(ExplorerActions.resetPage());
      dispatch(ExplorerActions.toggleFilterByMedicinalProduct());
      dispatch(ExplorerActions.updateEntities());
    });

  const onToggleFilterByOther = () =>
    batch(() => {
      dispatch(ExplorerActions.resetPage());
      dispatch(ExplorerActions.toggleFilterByOther());
      dispatch(ExplorerActions.updateEntities());
    });

  return { onToggleFilterByDrug, onToggleFilterByMedicinalProduct, onToggleFilterByOther };
};

const mapStateToProps = (state: IState) => {
  const filterByDrug = ExplorerSelectors.selectFilterByDrug(state);
  const filterByMedicinalProduct = ExplorerSelectors.selectFilterByMedicinalProduct(state);
  const filterByOther = ExplorerSelectors.selectFilterByOther(state);

  return { filterByDrug, filterByMedicinalProduct, filterByOther };
};

export const ExplorerToggleBar = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(withStyles(styles)(ExplorerToggleBarComponent));

export default ExplorerToggleBar;
