import {
    LOADING_TOGGLE_ACTION,
    LOGIN_CONFIRMED_ACTION,
    LOGIN_FAILED_ACTION,
    CLEAR_AUTH_ERRORS_ACTION,
    LOGOUT_ACTION,
} from '../actions/AuthActions';

const initialState = {
    auth: {
        token: '',
        user: null,
    },
    errorMessage: '',
    fieldErrors: {},
    successMessage: '',
    showLoading: false,
};

export function AuthReducer(state = initialState, action) {
    if (action.type === LOGIN_CONFIRMED_ACTION) {
        return {
            ...state,
            auth: {
                token: action.payload.access_token,
                user: action.payload.user,
            },
            errorMessage: '',
            fieldErrors: {},
            successMessage: 'Login Successfully Completed',
            showLoading: false,
        };
    }

    if (action.type === LOGOUT_ACTION) {
        return {
            ...state,
            auth: { token: '', user: null },
            errorMessage: '',
            fieldErrors: {},
            successMessage: '',
            showLoading: false,
        };
    }

    if (action.type === CLEAR_AUTH_ERRORS_ACTION) {
        return {
            ...state,
            errorMessage: '',
            fieldErrors: {},
        };
    }

    if (action.type === LOGIN_FAILED_ACTION) {
        const payload = typeof action.payload === 'string'
            ? { message: action.payload, fieldErrors: {} }
            : action.payload;

        return {
            ...state,
            errorMessage: payload.message ?? '',
            fieldErrors: payload.fieldErrors ?? {},
            successMessage: '',
            showLoading: false,
        };
    }

    if (action.type === LOADING_TOGGLE_ACTION) {
        return {
            ...state,
            showLoading: action.payload,
        };
    }

    return state;
}
