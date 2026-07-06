import {
    browseAliExpress,
    getAliExpressTop,
    getAliExpressStatus,
} from '../../services/AliExpressService';
import {
    ALI_SEARCH_REQUEST,
    ALI_SEARCH_SUCCESS,
    ALI_SEARCH_FAILURE,
    ALI_STATUS_REQUEST,
    ALI_STATUS_SUCCESS,
    ALI_STATUS_FAILURE,
} from '../reducers/AliExpressReducer';

const handleAliError = (err) => {
    const data = err.response?.data ?? {};
    const platformUnavailable = Boolean(data.platform_unavailable ?? data.requires_auth);
    return {
        error: data.error ?? 'AliExpress request failed.',
        requires_auth: platformUnavailable,
        credentials_missing: data.credentials_missing ?? false,
    };
};

export const searchAliExpressAction = (params = {}) => (dispatch) => {
    dispatch({ type: ALI_SEARCH_REQUEST });
    return browseAliExpress(params)
        .then((res) => dispatch({ type: ALI_SEARCH_SUCCESS, payload: res.data }))
        .catch((err) => dispatch({ type: ALI_SEARCH_FAILURE, payload: handleAliError(err) }));
};

export const fetchAliExpressTopAction = (params = {}) => (dispatch) => {
    dispatch({ type: ALI_SEARCH_REQUEST });
    return getAliExpressTop(params)
        .then((res) => dispatch({ type: ALI_SEARCH_SUCCESS, payload: res.data }))
        .catch((err) => dispatch({ type: ALI_SEARCH_FAILURE, payload: handleAliError(err) }));
};

export const fetchAliExpressStatus = () => (dispatch) => {
    dispatch({ type: ALI_STATUS_REQUEST });
    return getAliExpressStatus()
        .then((res) => dispatch({ type: ALI_STATUS_SUCCESS, payload: res.data }))
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'Failed to load AliExpress status.';
            dispatch({ type: ALI_STATUS_FAILURE, payload: msg });
        });
};
