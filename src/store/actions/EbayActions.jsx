import {
    getEbayStatus,
    disconnectEbayConnection,
    setEbayPrimary,
    syncEbayListings,
    getEbayListings,
    getEbayDrafts,
    searchEbayMarketplace,
} from '../../services/EbayService';

import {
    EBAY_STATUS_REQUEST, EBAY_STATUS_SUCCESS, EBAY_STATUS_FAILURE,
    EBAY_DISCONNECT, EBAY_SET_PRIMARY,
    EBAY_LISTINGS_REQUEST, EBAY_LISTINGS_SUCCESS, EBAY_LISTINGS_FAILURE,
    EBAY_SYNC_REQUEST, EBAY_SYNC_SUCCESS, EBAY_SYNC_FAILURE,
    EBAY_DRAFTS_REQUEST, EBAY_DRAFTS_SUCCESS, EBAY_DRAFTS_FAILURE,
    EBAY_MARKET_REQUEST, EBAY_MARKET_SUCCESS, EBAY_MARKET_FAILURE,
} from '../reducers/EbayReducer';

import { toast } from '../../utils/toast';

function normalizePaginatedPayload(payload) {
    if (!payload || Array.isArray(payload)) {
        return { data: payload ?? [], meta: {} };
    }

    if (Array.isArray(payload.data) && payload.meta) {
        return payload;
    }

    if (!Array.isArray(payload.data)) {
        return { data: [], meta: {} };
    }

    const {
        data,
        current_page,
        last_page,
        per_page,
        total,
        from,
        to,
    } = payload;

    return {
        data,
        meta: {
            current_page,
            last_page,
            per_page,
            total,
            from,
            to,
        },
    };
}

// ─── Connection management ────────────────────────────────────────────────────

export const fetchEbayStatus = () => (dispatch) => {
    dispatch({ type: EBAY_STATUS_REQUEST });
    return getEbayStatus()
        .then((res) => dispatch({ type: EBAY_STATUS_SUCCESS, payload: res.data }))
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'Failed to fetch eBay status.';
            dispatch({ type: EBAY_STATUS_FAILURE, payload: msg });
        });
};

export const disconnectEbayAction = (id) => (dispatch) => {
    return disconnectEbayConnection(id)
        .then(() => {
            dispatch({ type: EBAY_DISCONNECT, payload: id });
            toast.success('eBay account disconnected.');
        })
        .catch(() => toast.error('Failed to disconnect eBay account.'));
};

export const setEbayPrimaryAction = (id) => (dispatch) => {
    return setEbayPrimary(id)
        .then(() => {
            dispatch({ type: EBAY_SET_PRIMARY, payload: id });
            toast.success('Primary eBay account updated.');
        })
        .catch(() => toast.error('Failed to update primary account.'));
};

// ─── Sync ─────────────────────────────────────────────────────────────────────

export const syncEbayListingsAction = (connectionId) => (dispatch) => {
    dispatch({ type: EBAY_SYNC_REQUEST, payload: connectionId });
    toast.info('Syncing listings from eBay…');
    return syncEbayListings(connectionId)
        .then((res) => {
            dispatch({ type: EBAY_SYNC_SUCCESS, payload: connectionId });
            dispatch(fetchEbayListings({ connection_id: connectionId }));
            toast.success(res.data?.message ?? 'Listings synced from eBay.');
        })
        .catch((err) => {
            dispatch({ type: EBAY_SYNC_FAILURE, payload: connectionId });
            toast.error(err.response?.data?.error ?? 'eBay sync failed.');
        });
};

// ─── Listings ────────────────────────────────────────────────────────────────

export const fetchEbayListings = (params = {}) => (dispatch) => {
    dispatch({ type: EBAY_LISTINGS_REQUEST });
    return getEbayListings(params)
        .then((res) => dispatch({ type: EBAY_LISTINGS_SUCCESS, payload: normalizePaginatedPayload(res.data) }))
        .catch((err) => {
            const msg = err.response?.data?.error ?? 'Failed to load eBay listings.';
            dispatch({ type: EBAY_LISTINGS_FAILURE, payload: msg });
            toast.error(msg);
        });
};

export const fetchEbayDrafts = (params = {}) => (dispatch) => {
    dispatch({ type: EBAY_DRAFTS_REQUEST });
    return getEbayDrafts(params)
        .then((res) => dispatch({ type: EBAY_DRAFTS_SUCCESS, payload: normalizePaginatedPayload(res.data) }))
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
