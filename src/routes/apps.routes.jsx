import AppProfile from '../pages/apps/app-profile';
import EditProfile from '../pages/apps/edit-profile';
import PostDetails from '../pages/apps/post-details';
import BlogPost from '../pages/blog/blog-post';
import BlogHome from '../pages/blog/blog-home';
import Pricing from '../pages/pricing';
import Notes from '../pages/note';
import FileManager from '../pages/file-manager';
import Calendar from '../pages/calender';
import ProjectList from '../pages/projects/project-list';
import AddProject from '../pages/projects/add-project';
import ProjectCard from '../pages/projects/project-card';
import ContactList from '../pages/contacts/contact-list';
import ContactCard from '../pages/contacts/contact-card';
import EmailCompose from '../pages/email/email-compose';
import EmailInbox from '../pages/email/email-inbox';
import EmailRead from '../pages/email/email-read';
import Widget from '../pages/widget/Widget';

export const appsRoutes = [
    { path: '/app-profile', element: <AppProfile /> },
    { path: '/edit-profile', element: <EditProfile /> },
    { path: '/post-details', element: <PostDetails /> },
    { path: '/blog-post', element: <BlogPost /> },
    { path: '/blog-home', element: <BlogHome /> },
    { path: '/pricing', element: <Pricing /> },
    { path: '/note', element: <Notes /> },
    { path: '/file-manager', element: <FileManager /> },
    { path: '/calendar', element: <Calendar /> },
    { path: '/project-list', element: <ProjectList /> },
    { path: '/add-project', element: <AddProject /> },
    { path: '/project-card', element: <ProjectCard /> },
    { path: '/contact-list', element: <ContactList /> },
    { path: '/contact-card', element: <ContactCard /> },
    { path: '/email-compose', element: <EmailCompose /> },
    { path: '/email-inbox', element: <EmailInbox /> },
    { path: '/email-read', element: <EmailRead /> },
    { path: '/widget-basic', element: <Widget /> },
];
