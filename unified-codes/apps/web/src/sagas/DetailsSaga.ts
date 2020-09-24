import { call, put, takeEvery, all, delay } from 'redux-saga/effects';

import {
  AlertSeverity,
  IEntity,
  IAlert,
} from '@unified-codes/data';

import {
  DETAILS_ACTIONS,
  DetailsActions,
  AlertActions,
  IDetailsFetchEntityAction,
} from '../actions';


const ALERT_SEVERITY = {
  FETCH: AlertSeverity.info,
  ERROR: AlertSeverity.error,
};

const ALERT_TEXT = {
  FETCH: 'Fetching...',
  ERROR: 'Could not fetch entity.',
};

const alertError: IAlert = {
  isVisible: true,
  severity: ALERT_SEVERITY.ERROR,
  text: ALERT_TEXT.ERROR,
};

const alertFetch: IAlert = {
  isVisible: true,
  severity: ALERT_SEVERITY.FETCH,
  text: ALERT_TEXT.FETCH,
};

const getEntityQuery = (code: string) => `
{
  entity (code: "${code}") {
    code
    description
    type
    has_property {
      type
      value
    }
    # form_category
    has_child {
      code
      description
      type
      # form
      has_child {
        code
        description
        type
      }
    }
  }
}`;

const getEntity = async (
  url: string,
  code: string
): Promise<IEntity> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: getEntityQuery(code),
    }),
  });
  const json = await response.json();
  const { data } = json;
  const { entity } = data;
  return entity;
};

function* fetchDetails(action: IDetailsFetchEntityAction) {
  yield put(AlertActions.raiseAlert(alertFetch));
  try {
    const url = `${process.env.NX_DATA_SERVICE_URL}:${process.env.NX_DATA_SERVICE_PORT}/${process.env.NX_DATA_SERVICE_GRAPHQL}`;
    const entity: IEntity = yield call(getEntity, url, action.code);
    yield put(AlertActions.resetAlert());
    yield put(DetailsActions.fetchEntitySuccess(entity));
  } catch (error) {
    yield put(AlertActions.raiseAlert(alertError));
    yield put(DetailsActions.fetchEntityFailure(error));
  }
}

function* fetchDetailsSaga() {
  yield takeEvery<IDetailsFetchEntityAction>(DETAILS_ACTIONS.FETCH_ENTITY, fetchDetails);
}


export function* detailsSaga() {
  yield all([fetchDetailsSaga()]);
}

export default detailsSaga;