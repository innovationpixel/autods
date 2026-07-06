import { useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Nav from '../layouts/nav';
import Footer from '../layouts/Footer';
import ScrollToTop from '../elements/scrolltotop';
import PrivateRoute from '../components/PrivateRoute';
import { checkAutoLogin } from '../store/actions/AuthActions';

// Pages
import Home from '../pages/dashboard/Home';
import LockScreen from '../pages/error/LockScreen';
import Error400 from '../pages/error/Error400';
import Error403 from '../pages/error/Error403';
import Error404 from '../pages/error/Error404';
import Error500 from '../pages/error/Error500';
import Error503 from '../pages/error/Error503';
import EmptyPage from '../pages/error/emptypage';
import Login from '../pages/authentication/Login';
import Registration from '../pages/authentication/Registration';
import OAuthCallback from '../pages/OAuthCallback';

// Feature route arrays
import { dashboardRoutes } from './dashboard.routes';
import { accountRoutes } from './account.routes';
import { aikitRoutes } from './aikit.routes';
import { cmsRoutes } from './cms.routes';
import { profileRoutes } from './profile.routes';
import { ecommerceRoutes } from './ecommerce.routes';
import { appsRoutes } from './apps.routes';
import { chartsRoutes } from './charts.routes';
import { bootstrapRoutes } from './bootstrap.routes';
import { pluginsRoutes } from './plugins.routes';
import { formsRoutes } from './forms.routes';
import { tablesRoutes } from './tables.routes';

const Markup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        checkAutoLogin(dispatch, navigate);
    }, []);

    return (
        <>
            <Routes>
                {/* Public auth routes — no layout */}
                <Route path="/user/login" element={<Login />} />
                {/* <Route path="/user/register" element={<Registration />} />
                <Route path="/user/lock-screen" element={<LockScreen />} /> */}
                <Route path="/oauth/callback" element={<OAuthCallback />} />

                {/* Standalone error pages — no layout */}
                <Route path="/page-error-400" element={<Error400 />} />
                <Route path="/page-error-403" element={<Error403 />} />
                <Route path="/page-error-404" element={<Error404 />} />
                <Route path="/page-error-500" element={<Error500 />} />
                <Route path="/page-error-503" element={<Error503 />} />

                {/* All protected app routes */}
                <Route element={<PrivateRoute />}>
                    {/* MarketplaceDashboard pages — component has its own layout */}
                    <Route path="/" element={<Home />} />
                    <Route path="/marketplace" element={<Home />} />
                    <Route path="/print-on-demand" element={<Home />} />
                    <Route path="/order-processing" element={<Home />} />
                    <Route path="/calculations" element={<Home />} />
                    <Route path="/orders" element={<Home />} />
                    <Route path="/sourcing-request" element={<Home />} />
                    <Route path="/products" element={<Home />} />
                    <Route path="/drafts" element={<Home />} />
                    <Route path="/customer-support" element={<Home />} />
                    <Route path="/support-center" element={<Home />} />
                    <Route path="/wallet" element={<Home />} />
                    <Route path="/settings" element={<Home />} />
                    <Route path="/plans" element={<Home />} />
                    <Route path="/admin" element={<Home />} />
                    <Route path="/admin/clients" element={<Home />} />
                    <Route path="/admin/plans" element={<Home />} />
                    <Route path="/admin/settings" element={<Home />} />

                    <Route element={<MainLayout />}>
                        {dashboardRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {accountRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {aikitRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {cmsRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {profileRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {ecommerceRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {appsRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {chartsRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {bootstrapRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {pluginsRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {formsRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}
                        {tablesRoutes.map((r) => (
                            <Route key={r.path} path={r.path} element={r.element} />
                        ))}

                        {/* In-layout error/misc pages */}
                        <Route path="/lock-screen" element={<LockScreen />} />
                        <Route path="/error-400" element={<Error400 />} />
                        <Route path="/error-403" element={<Error403 />} />
                        <Route path="/error-404" element={<Error404 />} />
                        <Route path="/error-500" element={<Error500 />} />
                        <Route path="/error-503" element={<Error503 />} />
                        <Route path="/empty-page" element={<EmptyPage />} />
                    </Route>

                    <Route path="*" element={<Home />} />
                </Route>

                <Route path="*" element={<Error404 />} />
            </Routes>
            <ScrollToTop />
        </>
    );
};

function MainLayout() {
    const { menuToggle, sidebariconHover } = useContext(ThemeContext);

    return (
        <div
            id="main-wrapper"
            className={`show ${sidebariconHover ? 'iconhover-toggle' : ''} ${menuToggle ? 'menu-toggle' : ''}`}
        >
            <Nav />
            <div className="content-body" style={{ minHeight: '849px' }}>
                <div className="container-fluid">
                    <Outlet />
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Markup;
