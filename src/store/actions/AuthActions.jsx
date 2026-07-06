import {
    login,
    register,
    logout,
    saveSession,
    clearSession,
    getStoredUser,
    getStoredToken,
    updateProfile,
    getMe,
} from '../../services/AuthService';
import { toast } from '../../utils/toast';
import { parseApiErrors } from '../../utils/apiErrors';

export const LOGIN_CONFIRMED_ACTION  = '[login action] confirmed login';
export const LOGIN_FAILED_ACTION     = '[login action] failed login';
export const CLEAR_AUTH_ERRORS_ACTION = '[login action] clear auth errors';
export const LOGOUT_ACTION           = '[Logout action] logout action';
export const LOADING_TOGGLE_ACTION   = '[Loading action] toggle loading';

export function clearAuthErrorsAction() {
    return { type: CLEAR_AUTH_ERRORS_ACTION };
}

export function loginAction(email, password, navigate) {
    return (dispatch) => {
        dispatch(loadingToggleAction(true));
        dispatch(clearAuthErrorsAction());

        login(email, password)
            .then((response) => {
                saveSession(response.data);
                dispatch(loginConfirmedAction(response.data));
                toast.success('Logged in successfully.');
                navigate(response.data?.user?.role === 'super_admin' ? '/admin' : '/');
            })
            .catch((error) => {
                const { message, fieldErrors } = parseApiErrors(error);
                dispatch(loginFailedAction({ message, fieldErrors }));
                toast.error(message);
            })
            .finally(() => dispatch(loadingToggleAction(false)));
    };
}

export function logoutAction(navigate) {
    return (dispatch) => {
        clearSession();
        dispatch({ type: LOGOUT_ACTION });
        toast.info('You have been logged out.');
        navigate('/user/login');
        logout().catch(() => {});
    };
}

export function checkAutoLogin(dispatch, navigate) {
    const token = getStoredToken();
    const user  = getStoredUser();

    if (!token || !user) {
        clearSession();
        return;
    }

    // Hydrate Redux immediately from localStorage so the UI renders without flicker
    dispatch(loginConfirmedAction({ access_token: token, user }));

    // Then fetch fresh user data from the server to ensure name/email are current
    getMe()
        .then((res) => {
            const fresh = res.data;
            // Only update if something actually changed to avoid spurious re-renders
            if (
                fresh.name  !== user.name  ||
                fresh.email !== user.email ||
                fresh.role  !== user.role
            ) {
                saveSession({ access_token: token, user: fresh });
                dispatch(loginConfirmedAction({ access_token: token, user: fresh }));
            }
        })
        .catch(() => {
            clearSession();
            dispatch({ type: LOGOUT_ACTION });
            if (!window.location.pathname.startsWith('/user/login')) {
                navigate('/user/login');
            }
        });

    if (window.location.pathname === '/user/login') {
        navigate(user?.role === 'super_admin' ? '/admin' : '/');
    }
}

export function signupAction(name, email, password, passwordConfirmation, navigate) {
    return (dispatch) => {
        dispatch(loadingToggleAction(true));
        register(name, email, password, passwordConfirmation)
            .then((response) => {
                saveSession(response.data);
                dispatch(loginConfirmedAction(response.data));
                toast.success('Account created successfully!');
                navigate('/');
            })
            .catch((error) => {
                const { message, fieldErrors } = parseApiErrors(error);
                dispatch(loginFailedAction({ message, fieldErrors }));
                toast.error(message);
            })
            .finally(() => dispatch(loadingToggleAction(false)));
    };
}

export function updateProfileAction(payload) {
    return (dispatch) => {
        return updateProfile(payload)
            .then((response) => {
                const user = response.data.user;
                const stored = getStoredUser();
                saveSession({ access_token: getStoredToken(), user: { ...stored, ...user } });
                dispatch({ type: LOGIN_CONFIRMED_ACTION, payload: { access_token: getStoredToken(), user: { ...stored, ...user } } });
                toast.success('Profile updated successfully.');
                return response.data;
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Failed to update profile.';
                toast.error(message);
                throw error;
            });
    };
}

export function loginConfirmedAction(data) {
    return {
        type: LOGIN_CONFIRMED_ACTION,
        payload: data,
    };
}

export function loginFailedAction(payload) {
    return {
        type: LOGIN_FAILED_ACTION,
        payload,
    };
}

export function loadingToggleAction(status) {
    return {
        type: LOADING_TOGGLE_ACTION,
        payload: status,
    };
}
