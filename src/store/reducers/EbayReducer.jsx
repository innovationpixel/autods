export const EBAY_STATUS_REQUEST  = 'EBAY_STATUS_REQUEST';
export const EBAY_STATUS_SUCCESS  = 'EBAY_STATUS_SUCCESS';
export const EBAY_STATUS_FAILURE  = 'EBAY_STATUS_FAILURE';
export const EBAY_DISCONNECT      = 'EBAY_DISCONNECT';

export const EBAY_LISTINGS_REQUEST = 'EBAY_LISTINGS_REQUEST';
export const EBAY_LISTINGS_SUCCESS = 'EBAY_LISTINGS_SUCCESS';
export const EBAY_LISTINGS_FAILURE = 'EBAY_LISTINGS_FAILURE';

export const EBAY_SYNC_REQUEST    = 'EBAY_SYNC_REQUEST';
export const EBAY_SYNC_SUCCESS    = 'EBAY_SYNC_SUCCESS';
export const EBAY_SYNC_FAILURE    = 'EBAY_SYNC_FAILURE';

export const EBAY_DRAFTS_REQUEST  = 'EBAY_DRAFTS_REQUEST';
export const EBAY_DRAFTS_SUCCESS  = 'EBAY_DRAFTS_SUCCESS';
export const EBAY_DRAFTS_FAILURE  = 'EBAY_DRAFTS_FAILURE';

export const EBAY_MARKET_REQUEST  = 'EBAY_MARKET_REQUEST';
export const EBAY_MARKET_SUCCESS  = 'EBAY_MARKET_SUCCESS';
export const EBAY_MARKET_FAILURE  = 'EBAY_MARKET_FAILURE';

const initialState = {
    connection: {
        connected: false,
        ebay_username: null,
        ebay_user_id: null,
        site_id: null,
        loading: false,
        error: null,
    },
    listings: {
        data: [],
        meta: { total: 0, current_page: 1, last_page: 1 },
        loading: false,
        syncing: false,
        error: null,
    },
    drafts: {
        data: [],
        meta: { total: 0 },
        loading: false,
        error: null,
    },
    marketplace: {
        items: [],
        total: 0,
        loading: false,
        error: null,
    },
};

export function EbayReducer(state = initialState, action) {
    switch (action.type) {
        case EBAY_STATUS_REQUEST:
            return { ...state, connection: { ...state.connection, loading: true, error: null } };
        case EBAY_STATUS_SUCCESS:
            return { ...state, connection: { ...action.payload, loading: false, error: null } };
        case EBAY_STATUS_FAILURE:
            return { ...state, connection: { ...state.connection, loading: false, error: action.payload } };
        case EBAY_DISCONNECT:
            return { ...state, connection: initialState.connection };

        case EBAY_LISTINGS_REQUEST:
            return { ...state, listings: { ...state.listings, loading: true, error: null } };
        case EBAY_LISTINGS_SUCCESS:
            return { ...state, listings: { data: action.payload.data ?? [], meta: action.payload.meta ?? action.payload, loading: false, syncing: false, error: null } };
        case EBAY_LISTINGS_FAILURE:
            return { ...state, listings: { ...state.listings, loading: false, error: action.payload } };

        case EBAY_SYNC_REQUEST:
            return { ...state, listings: { ...state.listings, syncing: true } };
        case EBAY_SYNC_SUCCESS:
            return { ...state, listings: { ...state.listings, syncing: false } };
        case EBAY_SYNC_FAILURE:
            return { ...state, listings: { ...state.listings, syncing: false, error: action.payload } };

        case EBAY_DRAFTS_REQUEST:
            return { ...state, drafts: { ...state.drafts, loading: true, error: null } };
        case EBAY_DRAFTS_SUCCESS:
            return { ...state, drafts: { data: action.payload.data ?? [], meta: action.payload.meta ?? {}, loading: false, error: null } };
        case EBAY_DRAFTS_FAILURE:
            return { ...state, drafts: { ...state.drafts, loading: false, error: action.payload } };

        case EBAY_MARKET_REQUEST:
            return { ...state, marketplace: { ...state.marketplace, loading: true, error: null } };
        case EBAY_MARKET_SUCCESS:
            return { ...state, marketplace: { items: action.payload.items ?? [], total: action.payload.total ?? 0, loading: false, error: null } };
        case EBAY_MARKET_FAILURE:
            return { ...state, marketplace: { ...state.marketplace, loading: false, error: action.payload } };

        default:
            return state;
    }
}
