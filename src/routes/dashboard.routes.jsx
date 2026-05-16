import DashboardDark from '../pages/dashboard/DashboardDark';
import Dashboard2 from '../pages/dashboard/dashboard-2';
import Projectpage from '../pages/dashboard/project-page';
import Contact from '../pages/dashboard/contact';
import Kanban from '../pages/dashboard/kanban';
import Message from '../pages/dashboard/message';

export const dashboardRoutes = [
    { path: '/dashboard', element: <DashboardDark /> },
    { path: '/dashboard-2', element: <Dashboard2 /> },
    { path: '/project-page', element: <Projectpage /> },
    { path: '/contact', element: <Contact /> },
    { path: '/kanban', element: <Kanban /> },
    { path: '/message', element: <Message /> },
];
