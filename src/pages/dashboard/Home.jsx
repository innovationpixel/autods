import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import MarketplaceDashboard from "../../components/dashboard/MarketplaceDashboard";
import SuperAdminShell from "../../components/dashboard/SuperAdminShell";
import { getStoredUser } from "../../services/AuthService";
import { selectUserRole } from "../../store/selectors/AuthSelectors";

function Home() {
	const role = useSelector(selectUserRole) ?? getStoredUser()?.role;
	const { pathname } = useLocation();

	if (role === "super_admin") {
		return <SuperAdminShell />;
	}

	if (pathname.startsWith("/admin")) {
		return <Navigate to="/" replace />;
	}

	return <MarketplaceDashboard />;
}

export default Home;
