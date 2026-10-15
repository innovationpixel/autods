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
		return (
		<div className="autoprime-portal">
			<SuperAdminShell />
		</div>
	);
	}

	if (pathname.startsWith("/admin")) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="autoprime-portal">
			<MarketplaceDashboard />
		</div>
	);
}

export default Home;
