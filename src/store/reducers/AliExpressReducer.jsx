export const ALI_SEARCH_REQUEST = 'ALI_SEARCH_REQUEST';
export const ALI_SEARCH_SUCCESS = 'ALI_SEARCH_SUCCESS';
export const ALI_SEARCH_FAILURE = 'ALI_SEARCH_FAILURE';

export const ALI_STATUS_REQUEST    = 'ALI_STATUS_REQUEST';
export const ALI_STATUS_SUCCESS    = 'ALI_STATUS_SUCCESS';
export const ALI_STATUS_FAILURE    = 'ALI_STATUS_FAILURE';
export const ALI_DISCONNECT_SUCCESS = 'ALI_DISCONNECT_SUCCESS';

const initialState = {
    marketplace: {
        items: [],
        total: 0,
        search_id: null,
        requires_auth: false,
        credentials_missing: false,
        loading: false,
        error: null,
    },
    connection: {
        loading: false,
        connected: false,
        credentials_configured: false,
        needs_reconnect: false,
        ae_user_nick: null,
        ae_user_id: null,
        ae_seller_id: null,
        ae_account: null,
        token_expires_at: null,
        connected_at: null,
        error: null,
    },
};

export function AliExpressReducer(state = initialState, action) {
    switch (action.type) {
        case ALI_SEARCH_REQUEST:
            return {
                ...state,
                marketplace: { ...state.marketplace, loading: true, error: null },
            };
        case ALI_SEARCH_SUCCESS:
            return {
                ...state,
                marketplace: {
                    items: action.payload.items ?? [],
                    total: action.payload.total ?? 0,
                    search_id: action.payload.search_id ?? null,
                    requires_auth: false,
                    credentials_missing: false,
                    loading: false,
                    error: null,
                },
            };
        case ALI_SEARCH_FAILURE:
            return {
                ...state,
                marketplace: {
                    ...state.marketplace,
                    loading: false,
                    error: action.payload.error ?? action.payload,
                    requires_auth: action.payload.requires_auth ?? false,
                    credentials_missing: action.payload.credentials_missing ?? false,
                },
            };

        case ALI_STATUS_REQUEST:
            return {
                ...state,
                connection: { ...state.connection, loading: true, error: null },
            };
        case ALI_STATUS_SUCCESS:
            return {
                ...state,
                connection: {
                    ...initialState.connection,
                    ...action.payload,
                    loading: false,
                    error: null,
                },
            };
        case ALI_STATUS_FAILURE:
            return {
                ...state,
                connection: { ...state.connection, loading: false, error: action.payload },
            };
        case ALI_DISCONNECT_SUCCESS:
            return {
                ...state,
                connection: { ...initialState.connection },
                marketplace: { ...initialState.marketplace },
            };

        default:
            return state;
    }
}
