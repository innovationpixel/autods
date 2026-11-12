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
                fresh.role  !== user.role  ||
                fresh.is_active !== user.is_active ||
                fresh.is_plan_paid !== user.is_plan_paid ||
                fresh.current_plan_id !== user.current_plan_id ||
                fresh.is_on_free_trial !== user.is_on_free_trial ||
                fresh.has_used_free_trial !== user.has_used_free_trial ||
                fresh.trial_ends_at !== user.trial_ends_at ||
                fresh.plan_expires_at !== user.plan_expires_at ||
                fresh.ai_credits !== user.ai_credits ||
                fresh.wallet_balance !== user.wallet_balance ||
                fresh.legal_accepted !== user.legal_accepted ||
                fresh.terms_accepted_at !== user.terms_accepted_at ||
                fresh.privacy_accepted_at !== user.privacy_accepted_at ||
                JSON.stringify(fresh.admin_modules) !== JSON.stringify(user.admin_modules)
            ) {
                const merged = { ...user, ...fresh };
                saveSession({ access_token: token, user: merged });
                dispatch(loginConfirmedAction({ access_token: token, user: merged }));
                if (fresh.ai_credits !== undefined) {
                    window.dispatchEvent(new CustomEvent('ai_credits_updated', { detail: { ai_credits: fresh.ai_credits, fromAuthAction: true } }));
                }
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

export function signupAction(nameOrPayload, email, password, passwordConfirmation, navigate) {
    return (dispatch) => {
        dispatch(loadingToggleAction(true));
        dispatch(clearAuthErrorsAction());
        return register(nameOrPayload, email, password, passwordConfirmation)
            .then((response) => {
                saveSession(response.data);
                dispatch(loginConfirmedAction(response.data));
                if (typeof navigate === 'function') {
                    navigate('/');
                }
                return response.data;
            })
            .catch((error) => {
                const { message, fieldErrors } = parseApiErrors(error);
                dispatch(loginFailedAction({ message, fieldErrors }));
                toast.error(message);
                throw error;
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

export function updateUserStateAction(partialUser) {
    return (dispatch) => {
        const stored = getStoredUser() || {};
        const merged = { ...stored, ...partialUser };
        const token = getStoredToken();
        saveSession({ access_token: token, user: merged });
        dispatch(loginConfirmedAction({ access_token: token, user: merged }));
        if (partialUser.ai_credits !== undefined) {
            window.dispatchEvent(new CustomEvent('ai_credits_updated', { detail: { ai_credits: partialUser.ai_credits, fromAuthAction: true } }));
        }
    };
}

export function fetchFreshUserAction() {
    return (dispatch) => {
        const token = getStoredToken();
        if (!token) return Promise.resolve(null);
        return getMe()
            .then((res) => {
                const fresh = res.data;
                const stored = getStoredUser() || {};
                const merged = { ...stored, ...fresh };
                saveSession({ access_token: token, user: merged });
                dispatch(loginConfirmedAction({ access_token: token, user: merged }));
                if (fresh.ai_credits !== undefined) {
                    window.dispatchEvent(new CustomEvent('ai_credits_updated', { detail: { ai_credits: fresh.ai_credits, fromAuthAction: true } }));
                }
                return merged;
            })
            .catch(() => null);
    };
}

export function loadingToggleAction(status) {
    return {
        type: LOADING_TOGGLE_ACTION,
        payload: status,
    };
}
