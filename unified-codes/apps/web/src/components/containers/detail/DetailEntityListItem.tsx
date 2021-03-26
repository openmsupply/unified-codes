import * as React from 'react';
import { connect } from 'react-redux';
import * as copy from 'clipboard-copy';

import { AlertActions, IAlertAction } from '../../../actions';
import { ITheme } from '../../../styles';
import { typeFormatter } from '../../../typeFormats';
import { AlertSeverity, IState } from '../../../types';

import DetailEntityList from './DetailEntityList';
import DetailPropertyList from './DetailPropertyList';

import { EEntityType, IEntity } from '@unified-codes/data/v1';

import { List, ListItem, IconButton, ListItemText, Collapse, ListItemIcon, ArrowUpIcon, ArrowDownIcon, FileCopyIcon } from '@unified-codes/ui/components';
import { createStyles, makeStyles } from '@unified-codes/ui/styles';

import { useToggle } from '@unified-codes/ui/hooks';

// TODO: pass styles down to children!
const useStyles = makeStyles((theme: ITheme) =>
  createStyles({
    copyButton: {
      marginRight: '8px',
    },
    icon: {
      marginRight: '8px',
      '&:hover': { backgroundColor: theme.palette.background.default },
    },
    item: {
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 16px',
      width: '100%',
      '& p': { color: theme.palette.action.active },
    },   
    list: {
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 0px',
      width: '100%',
      '&:hover': { backgroundColor: theme.palette.background.default },
    },
    rootItem: {
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 8px',
      width: '100%',
      '& p': { color: theme.palette.action.active },
    },   
    textItem: {
      margin: '1px 0px 1px 0px',
    },
    toggleItem: {
      margin: '0px 0px 0px 0px',
      padding: '0px 0px 0px 8px',
      width: '100%',
      '& p': { color: theme.palette.action.active },
    }
  })
);

interface DetailEntityListItemProps {
  entity: IEntity,
  onCopy: (code: string) => null,
}

export type DetailEntityListItem = React.FunctionComponent<DetailEntityListItemProps>;

const DetailEntityListItemComponent: DetailEntityListItem = ({
  entity,
  onCopy,
}) => {
  const classes = useStyles();

  const { isOpen, onToggle } = useToggle(false);

  const { code, type, description, children = [], properties = [] } = entity;

  const childCount = children?.length ?? 0;
  const propertyCount = properties?.length ?? 0;

  if (!childCount) return (
    <ListItem className={classes.item}>
      <ListItemIcon/>
      <ListItemText className={classes.textItem} primary={description} secondary={code}/>
      <IconButton className={classes.copyButton} onClick={(e) => { onCopy(code); e.stopPropagation() }}><FileCopyIcon/></IconButton>
    </ListItem> 
  );

  const ChildListToggleItemText = () => <ListItemText className={classes.textItem} primary={description} secondary={code} />;
  const ChildListToggleItemIcon = () => <IconButton className={classes.icon} onClick={(e) => { onToggle(); e.stopPropagation() }}>{ isOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}</IconButton>;

  const ChildListToggleItem = () =>
    (
      <ListItem className={classes.toggleItem} button onClick={(e) => { onToggle(); e.stopPropagation() }}>
        <ListItemIcon>
          <ChildListToggleItemIcon />
        </ListItemIcon>
        <ChildListToggleItemText />
        <IconButton className={classes.copyButton} onClick={(e) => { onCopy(code); e.stopPropagation() }}><FileCopyIcon/></IconButton>
      </ListItem>
    );

    const EntityList = () => {
      const entitiesByType = children.reduce((acc, child) => {
        const { type } = child;
        if (!acc[type]) acc[type] = [];
        acc[type] = [ ...acc[type], child ];
        return acc;
      }, {});

      return Object.keys(entitiesByType).map(type => {
        const entities = entitiesByType[type];
        const typeFormatted = typeFormatter(type);
        const description = `${typeFormatted} (${childCount})`;
        return <DetailEntityList description={description} entities={entities}/>;
      });
    }

    const PropertyList = () => {
      if (!propertyCount) return null;
      const description = `Properties (${propertyCount})`;
      return <DetailPropertyList description={description} properties={properties}/>;
    };
    
    const ChildList = () => <ListItem className={classes.item} style={{ flexDirection: 'column' }}><EntityList/><PropertyList/></ListItem>

    return (
      <ListItem className={type === EEntityType.DRUG ? classes.rootItem : classes.item}> 
        <List className={classes.list} >
          <ChildListToggleItem />
          <Collapse in={isOpen}><List className={classes.list}><ChildList/></List></Collapse>
        </List>
      </ListItem>
    );
};

const mapDispatchToProps = (dispatch: React.Dispatch<IAlertAction>) => {
  const onCopy = (code: string) => {
    copy(code);
    dispatch(AlertActions.raiseAlert({
      severity: AlertSeverity.Info,
      text: `Code ${code} copied to clipboard`,
      isVisible: true
    }));
  }

  return { onCopy };
};

const mapStateToProps = (_: IState) => ({});

const DetailEntityListItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(DetailEntityListItemComponent);

export default DetailEntityListItem;
