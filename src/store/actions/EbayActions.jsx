import {
    getEbayStatus,
    disconnectEbay,
    getEbayListings,
    syncEbayListings,
    getEbayDrafts,
    searchEbayMarketplace,
} from '../../services/EbayService';

import {
    EBAY_STATUS_REQUEST, EBAY_STATUS_SUCCESS, EBAY_STATUS_FAILURE,
    EBAY_DISCONNECT,
    EBAY_LISTINGS_REQUEST, EBAY_LISTINGS_SUCCESS, EBAY_LISTINGS_FAILURE,
    EBAY_SYNC_REQUEST, EBAY_SYNC_SUCCESS, EBAY_SYNC_FAILURE,
    EBAY_DRAFTS_REQUEST, EBAY_DRAFTS_SUCCESS, EBAY_DRAFTS_FAILURE,
    EBAY_MARKET_REQUEST, EBAY_MARKET_SUCCESS, EBAY_MARKET_FAILURE,
} from '../reducers/EbayReducer';

import { toast } from '../../utils/toast';

export const fetchEbayStatus = () => (dispatch) => {
    dispatch({ type: EBAY_STATUS_REQUEST });
    return getEbayStatus()
        .then((res) => dispatch({ type: EBAY_STATUS_SUCCESS, payload: res.data }))
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'Failed to fetch eBay connection status.';
            dispatch({ type: EBAY_STATUS_FAILURE, payload: msg });
        });
};

export const disconnectEbayAction = () => (dispatch) => {
    return disconnectEbay()
        .then(() => {
            dispatch({ type: EBAY_DISCONNECT });
            toast.success('eBay account disconnected successfully.');
        })
        .catch(() => toast.error('Failed to disconnect eBay account.'));
};

export const fetchEbayListings = (params = {}) => (dispatch) => {
    dispatch({ type: EBAY_LISTINGS_REQUEST });
    return getEbayListings(params)
        .then((res) => dispatch({ type: EBAY_LISTINGS_SUCCESS, payload: res.data }))
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'Failed to load eBay listings.';
            dispatch({ type: EBAY_LISTINGS_FAILURE, payload: msg });
            toast.error(msg);
        });
};

export const syncEbayListingsAction = () => (dispatch) => {
    dispatch({ type: EBAY_SYNC_REQUEST });
    toast.info('Syncing listings from eBay…');
    return syncEbayListings()
        .then((res) => {
            dispatch({ type: EBAY_SYNC_SUCCESS });
            dispatch(fetchEbayListings());
            const msg = res.data?.message ?? 'Listings synced from eBay.';
            toast.success(msg);
            return res.data;
        })
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'eBay sync failed.';
            dispatch({ type: EBAY_SYNC_FAILURE, payload: msg });
            toast.error(msg);
        });
};

export const fetchEbayDrafts = (params = {}) => (dispatch) => {
    dispatch({ type: EBAY_DRAFTS_REQUEST });
    return getEbayDrafts(params)
        .then((res) => dispatch({ type: EBAY_DRAFTS_SUCCESS, payload: res.data }))
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'Failed to load draft listings.';
            dispatch({ type: EBAY_DRAFTS_FAILURE, payload: msg });
            toast.error(msg);
        });
};

export const searchMarketplaceAction = (params = {}) => (dispatch) => {
    dispatch({ type: EBAY_MARKET_REQUEST });
    return searchEbayMarketplace(params)
        .then((res) => dispatch({ type: EBAY_MARKET_SUCCESS, payload: res.data }))
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'eBay marketplace search failed.';
            dispatch({ type: EBAY_MARKET_FAILURE, payload: msg });
            toast.error(msg);
        });
};
