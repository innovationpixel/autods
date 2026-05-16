import AccountOverview from '../pages/account/account-overview';
import AccountSettings from '../pages/account/account-settings';
import AccountSecurity from '../pages/account/account-security';
import AccountActivity from '../pages/account/account-activity';
import AccountBilling from '../pages/account/account-billing';
import AccountStatements from '../pages/account/account-statements';
import AccountReferrals from '../pages/account/account-referrals';
import AccountApiKeys from '../pages/account/acount-apikeys';
import AccountLogs from '../pages/account/account-logs';

export const accountRoutes = [
    { path: '/account-overview', element: <AccountOverview /> },
    { path: '/account-settings', element: <AccountSettings /> },
    { path: '/account-security', element: <AccountSecurity /> },
    { path: '/account-activity', element: <AccountActivity /> },
    { path: '/account-billing', element: <AccountBilling /> },
    { path: '/account-statements', element: <AccountStatements /> },
    { path: '/account-referrals', element: <AccountReferrals /> },
    { path: '/account-apikeys', element: <AccountApiKeys /> },
    { path: '/account-logs', element: <AccountLogs /> },
];
