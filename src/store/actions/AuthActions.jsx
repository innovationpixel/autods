import {
    login,
    logout,
    saveSession,
    clearSession,
    getStoredUser,
    getStoredToken,
} from '../../services/AuthService';

export const LOGIN_CONFIRMED_ACTION  = '[login action] confirmed login';
export const LOGIN_FAILED_ACTION     = '[login action] failed login';
export const LOGOUT_ACTION           = '[Logout action] logout action';
export const LOADING_TOGGLE_ACTION   = '[Loading action] toggle loading';

export function loginAction(email, password, navigate) {
    return (dispatch) => {
        login(email, password)
            .then((response) => {
                saveSession(response.data);
                dispatch(loginConfirmedAction(response.data));
                navigate('/');
            })
            .catch((error) => {
                const message =
                    error.response?.data?.message || 'Login failed. Please try again.';
                dispatch(loginFailedAction(message));
            });
    };
}

export function logoutAction(navigate) {
    return (dispatch) => {
        logout().finally(() => {
            clearSession();
            dispatch({ type: LOGOUT_ACTION });
            navigate('/user/login');
        });
    };
}

export function checkAutoLogin(dispatch, navigate) {
    const token = getStoredToken();
    const user = getStoredUser();

    if (!token || !user) {
        clearSession();
        navigate('/user/login');
        return;
    }

    dispatch(loginConfirmedAction({ access_token: token, user }));
}

export function signupAction(email, password, navigate) {
    return (dispatch) => {
        dispatch(loginFailedAction('Registration is not yet implemented.'));
    };
}

export function loginConfirmedAction(data) {
    return {
        type: LOGIN_CONFIRMED_ACTION,
        payload: data,
    };
}

export function loginFailedAction(message) {
    return {
        type: LOGIN_FAILED_ACTION,
        payload: message,
    };
}

export function loadingToggleAction(status) {
    return {
        type: LOADING_TOGGLE_ACTION,
        payload: status,
    };
}
