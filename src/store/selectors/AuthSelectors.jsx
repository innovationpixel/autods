import { getStoredToken, getStoredUser } from '../../services/AuthService';

export const isAuthenticated = (state) => Boolean(state?.auth?.auth?.token || getStoredToken());
export const selectUser = (state) => state?.auth?.auth?.user ?? getStoredUser();
export const selectUserRole = (state) => state?.auth?.auth?.user?.role ?? getStoredUser()?.role;
