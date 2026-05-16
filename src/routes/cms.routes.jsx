import Content from '../pages/cms/content';
import ContentAdd from '../pages/cms/content-add';
import Menu from '../pages/cms/menu';
import EmailTemplate from '../pages/cms/email-template';
import AddEmail from '../pages/cms/add-email';
import Blog from '../pages/cms/blog';
import AddBlog from '../pages/cms/add-blog';
import BlogCategory from '../pages/cms/blog-category';

export const cmsRoutes = [
    { path: '/content', element: <Content /> },
    { path: '/content-add', element: <ContentAdd /> },
    { path: '/menu', element: <Menu /> },
    { path: '/email-template', element: <EmailTemplate /> },
    { path: '/add-email', element: <AddEmail /> },
    { path: '/blog', element: <Blog /> },
    { path: '/add-blog', element: <AddBlog /> },
    { path: '/blog-category', element: <BlogCategory /> },
];
