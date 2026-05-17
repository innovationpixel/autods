export const isAuthenticated = (state) => Boolean(state.auth.auth.token);
export const selectUser = (state) => state.auth.auth.user;
export const selectUserRole = (state) => state.auth.auth.user?.role;
