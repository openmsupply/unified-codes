import { createSelector } from 'reselect';

import { EEntityField, EEntityType, IEntity } from '@unified-codes/data';

import { IExplorerSearchBarState, IExplorerState, IExplorerTableState, IExplorerToggleBarState, IState } from '../types';

const selectExplorer = (state: IState): IExplorerState => state.explorer;

const selectSearchBar = createSelector(
    selectExplorer,
    (explorer: IExplorerState) => explorer?.searchBar
);

const selectTable = createSelector(
    selectExplorer,
    (explorer: IExplorerState) => explorer?.table
);

const selectToggleBar = createSelector(
    selectExplorer,
    (explorer: IExplorerState) => explorer?.toggleBar
);

const selectInput = createSelector(
    selectSearchBar,
    (searchBar: IExplorerSearchBarState): string => searchBar?.input
);

const selectFilterBy = createSelector(
    selectSearchBar,
    (searchBar: IExplorerSearchBarState): EEntityField => searchBar?.filterBy
);

const selectLabel = createSelector(
    selectFilterBy,
    (filterBy: EEntityField): string => {
        switch (filterBy) {
            case EEntityField.CODE: return 'Search by code';
            case EEntityField.DESCRIPTION: return 'Search by description';
            default: return '';
        }
    }
);

const selectCode = createSelector(
    selectInput, selectFilterBy,
    (input: string, filterBy: EEntityField) => filterBy === EEntityField.CODE ? input : ''
);

const selectDescription = createSelector(
    selectInput, selectFilterBy,
    (input: string, filterBy: EEntityField) => filterBy === EEntityField.DESCRIPTION ? input : ''
);

const selectOrderBy = createSelector(
    selectTable,
    (table: IExplorerTableState): EEntityField => table?.orderBy
);

const selectOrderDesc = createSelector(
    selectTable,
    (table: IExplorerTableState): boolean => table?.orderDesc
);

const selectCount = createSelector(
    selectTable,
    (table: IExplorerTableState): number => table?.count
);

const selectRowsPerPage = createSelector(
    selectTable,
    (table: IExplorerTableState): number => table?.rowsPerPage
)

const selectPage = createSelector(
    selectTable,
    (table: IExplorerTableState): number => table?.page
)

const selectEntities = createSelector(
    selectTable,
    (table: IExplorerTableState): IEntity[] => table?.entities
);

const selectFilterByDrug = createSelector(
    selectToggleBar,
    (toggleBar: IExplorerToggleBarState): boolean => toggleBar?.[EEntityType.DRUG]
)

const selectFilterByMedicinalProduct = createSelector(
    selectToggleBar,
    (toggleBar: IExplorerToggleBarState): boolean => toggleBar?.[EEntityType.MEDICINAL_PRODUCT]
)

const selectFilterByOther = createSelector(
    selectToggleBar,
    (toggleBar: IExplorerToggleBarState): boolean => toggleBar?.[EEntityType.OTHER]
)

const selectTypes = createSelector(
    selectToggleBar,
    (toggleBar: IExplorerToggleBarState): EEntityType[] =>
    Object.keys(toggleBar).filter((type: EEntityType) => toggleBar[type]) as EEntityType[]
)

export const SearchBarSelectors = {
    selectFilterBy,
    selectInput,
    selectLabel,
};

export const TableSelectors = {
    selectCode,
    selectDescription,
    selectCount,
    selectEntities,
    selectOrderBy,
    selectOrderDesc,
    selectPage,
    selectRowsPerPage,
    selectTypes,
};

export const ToggleBarSelectors = {
    selectFilterByDrug,
    selectFilterByMedicinalProduct,
    selectFilterByOther,
};

export const ExplorerSelectors = {
    ...SearchBarSelectors,
    ...TableSelectors,
    ...ToggleBarSelectors
}

export default ExplorerSelectors;