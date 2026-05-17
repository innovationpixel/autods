import {
    LOADING_TOGGLE_ACTION,
    LOGIN_CONFIRMED_ACTION,
    LOGIN_FAILED_ACTION,
    LOGOUT_ACTION,
} from '../actions/AuthActions';

const initialState = {
    auth: {
        token: '',
        user: null,
    },
    errorMessage: '',
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
            successMessage: 'Login Successfully Completed',
            showLoading: false,
        };
    }

    if (action.type === LOGOUT_ACTION) {
        return {
            ...state,
            auth: { token: '', user: null },
            errorMessage: '',
            successMessage: '',
            showLoading: false,
        };
    }

    if (action.type === LOGIN_FAILED_ACTION) {
        return {
            ...state,
            errorMessage: action.payload,
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
