import ProfileOverview from '../pages/profile/profile-overview';
import ProfileProjects from '../pages/profile/profile-projects';
import ProfileProjectsDetails from '../pages/profile/profile-projects-details';
import ProfileCampaigns from '../pages/profile/profile-campaigns';
import ProfileDocuments from '../pages/profile/profile-documents';
import ProfileFollowers from '../pages/profile/profile-followers';
import ProfileActivity from '../pages/profile/profile-activity';

export const profileRoutes = [
    { path: '/profile-overview', element: <ProfileOverview /> },
    { path: '/profile-projects', element: <ProfileProjects /> },
    { path: '/profile-projects-details', element: <ProfileProjectsDetails /> },
    { path: '/profile-campaigns', element: <ProfileCampaigns /> },
    { path: '/profile-documents', element: <ProfileDocuments /> },
    { path: '/profile-followers', element: <ProfileFollowers /> },
    { path: '/profile-activity', element: <ProfileActivity /> },
];
