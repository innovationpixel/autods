export const MenuList = [
    {
        title: 'Dashboard', classsChange: 'mm-collapse', iconStyle: <i className="flaticon-home" />,
        content: [
            { title: 'Dashboard Light', to: 'dashboard' },
            { title: 'Dashboard Dark', to: 'dashboard-dark' },
            { title: 'Dashboard 2', to: 'dashboard-2' },
            { title: 'Projects', to: 'project-page' },
            { title: 'Contact', to: 'contact' },
            { title: 'Kanban', to: 'kanban' },
            { title: 'Message', to: 'message' },
        ],
    },
    {
        title: 'CMS', classsChange: 'mm-collapse', iconStyle: <i className="flaticon flaticon-cms" />,
        content: [
            { title: 'Content', to: 'content' },
            { title: 'Add Content', to: 'content-add' },
            { title: 'Menus', to: 'menu' },
            { title: 'Email Template', to: 'email-template' },
            { title: 'Add Email', to: 'add-email' },
            { title: 'Blog', to: 'blog' },
            { title: 'Add Blog', to: 'add-blog' },
            { title: 'Blog Category', to: 'blog-category' },
        ],
    },
    {
        title: 'Profile', classsChange: 'mm-collapse', iconStyle: <i className="flaticon flaticon-user-1" />,
        content: [
            { title: 'Overview', to: 'profile-overview' },
            { title: 'Projects', to: 'profile-projects' },
            { title: 'Projects Details', to: 'profile-projects-details' },
            { title: 'Campaigns', to: 'profile-campaigns' },
            { title: 'Documents', to: 'profile-documents' },
            { title: 'Followers', to: 'profile-followers' },
            { title: 'Activity', to: 'profile-activity' },
        ],
    },
    {
        title: 'Account', classsChange: 'mm-collapse', iconStyle: <i className="flaticon flaticon-app" />,
        content: [
            { title: 'Overview', to: 'account-overview' },
            { title: 'Settings', to: 'account-settings' },
            { title: 'Security', to: 'account-security' },
            { title: 'Activity', to: 'account-activity' },
            { title: 'Billing', to: 'account-billing' },
            { title: 'Statements', to: 'account-statements' },
            { title: 'Referrals', to: 'account-referrals' },
            { title: 'Api keys', to: 'account-apikeys' },
            { title: 'Logs', to: 'account-logs' },
        ],
    },
    {
        title: 'AIKit', classsChange: 'mm-collapse', iconStyle: <i className="flaticon flaticon-app" />,
        content: [
            { title: 'Auto Write', to: 'auto-write' },
            { title: 'Scheduled', to: 'scheduled' },
            { title: 'Repurpose', to: 'repurpose' },
            { title: 'RSS', to: 'rss' },
            { title: 'Chatbot', to: 'chatbot' },
            { title: 'Fine Tune Models', to: 'fine-tune-models' },
            { title: 'Prompt', to: 'prompt' },
            { title: 'Setting', to: 'setting' },
            { title: 'Import', to: 'import' },
        ]
    },
    {
        title: 'User', classsChange: 'mm-collapse', iconStyle: <i className="flaticon-user" />,
        content: [
            { title: 'Profile', to: 'app-profile', },
            { title: 'Edit Profile', to: 'edit-profile', },
            { title: 'Post Details', to: 'post-details', },
        ]
    },
    {
        title: 'Blog', classsChange: 'mm-collapse', iconStyle: <i className="flaticon-blog" />,
        content: [
            { title: 'Blog Post', to: 'blog-post', },
            { title: 'Blog Home', to: 'blog-home', },
        ]
    },
    { title: 'Pricing', to: 'pricing', iconStyle: <i className="flaticon-price-tag" />, },
    { title: 'Apps', classsChange: 'menu-title', },
    {
        title: 'Ecommerce', iconStyle: <i className="flaticon-shopping-bag" />, classsChange: 'mm-collapse',
        content: [
            {
                title: 'Categories', hasMenu: true,
                content: [
                    { title: 'Category Table', to: 'category-table', },
                    { title: 'Add Category', to: 'add-category', },
                    { title: 'Edit Category', to: 'edit-category', },
                ]
            },
            {
                title: 'Products', hasMenu: true,
                content: [
                    { title: 'Product Table', to: 'product-table', },
                    { title: 'Add Product', to: 'add-product', },
                    { title: 'Edit Product', to: 'edit-product', },
                ]
            },
            {
                title: 'Shop', hasMenu: true,
                content: [
                    { title: 'Product Grid', to: 'ecom-product-grid', },
                    { title: 'Product List', to: 'ecom-product-list', },
                    { title: 'Product Details', to: 'ecom-product-detail', },
                    { title: 'Order', to: 'ecom-product-order', },
                    { title: 'Checkout', to: 'ecom-checkout', },
                    { title: 'Invoice', to: 'ecom-invoice', },
                    { title: 'Customers', to: 'ecom-customers', },
                ]
            },
        ]
    },
    {
        title: 'Projects', classsChange: 'mm-collapse', iconStyle: <i className="flaticon-rocket" />,
        content: [
            { title: 'Project List', to: 'project-list', },
            { title: 'Project Card', to: 'project-card', },
            { title: 'Add Project', to: 'add-project', },
        ],
    },
    { title: 'Notes', to: 'note', iconStyle: <i className="flaticon-notes" /> },
    { title: 'File Manager', to: 'file-manager', iconStyle: <i className="flaticon-approved" /> },

    {
        title: 'Contacts', iconStyle: <i className="flaticon-phone-book" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Contact List', to: 'contact-list' },
            { title: 'Contact Card', to: 'contact-card' },
        ],
    },
    {
        title: 'Inbox', iconStyle: <i className="flaticon-email" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Compose', to: 'email-compose' },
            { title: 'Inbox', to: 'email-inbox' },
            { title: 'Read', to: 'email-read' },
        ],
    },
    { title: 'Calender', iconStyle: <i className="flaticon-calendar-2" />, to: 'calendar' },
    { title: 'Components', classsChange: 'menu-title', },
    {
        title: 'Charts', iconStyle: <i className="flaticon-bar-chart" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Rechart', to: 'chart-rechart' },
            { title: 'Chartjs', to: 'chart-chartjs' },
            { title: 'Sparkline', to: 'chart-sparkline' },
            { title: 'Apex Chart', to: 'chart-apexchart' }, 
        ]
    },
    {
        title: 'Bootstrap', iconStyle: <i className="flaticon-web" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Accordion', to: 'ui-accordion', },
            { title: 'Alert', to: 'ui-alert', },
            { title: 'Badge', to: 'ui-badge', },
            { title: 'Button', to: 'ui-button', },
            { title: 'Modal', to: 'ui-modal', },
            { title: 'Button Group', to: 'ui-button-group', },
            { title: 'List Group', to: 'ui-list-group', },
            { title: 'Cards', to: 'ui-card', },
            { title: 'Carousel', to: 'ui-carousel', },
            { title: 'Dropdown', to: 'ui-dropdown', },
            { title: 'Popover', to: 'ui-popover', },
            { title: 'Progressbar', to: 'ui-progressbar', },
            { title: 'Tab', to: 'ui-tab', },
            { title: 'Typography', to: 'ui-typography', },
            { title: 'Pagination', to: 'ui-pagination', },
            { title: 'Grid', to: 'ui-grid', },
        ]
    },
    {
        title: 'Plugins', iconStyle: <i className="flaticon-puzzle" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Select 2', to: 'uc-select2' },
            { title: 'Noui Slider', to: 'uc-noui-slider' },
            { title: 'Sweet Alert', to: 'uc-sweetalert' },
            { title: 'Toastr', to: 'uc-toastr' },
            { title: 'Light Gallery', to: 'uc-lightgallery' },
        ]
    },

    { title: 'Widget', iconStyle: <i className="flaticon-app" />, to: 'widget-basic', },
    {
        title: 'Forms', iconStyle: <i className="flaticon-registration" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Form Elements', to: 'form-element' },
            { title: 'Wizard', to: 'form-wizard' },
            { title: 'CkEditor', to: 'form-ckeditor' },
            { title: 'Pickers', to: 'form-pickers' },
            { title: 'Form Validate', to: 'form-validation' },
        ]
    },
    {
        title: 'Table', iconStyle: <i className="flaticon-grid" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Bootstrap', to: 'table-bootstrap-basic', },
            { title: 'Datatable', to: 'table-datatable-basic', },
        ]
    },
    {
        title: 'Pages', iconStyle: <i className="flaticon-file" />, classsChange: 'mm-collapse',
        content: [
            { title: 'Login', to: 'page-login' },
            { title: 'Register', to: 'page-register' },
            {
                title: 'Error', hasMenu: true,
                content: [
                    { title: 'Error 400', to: 'page-error-400' },
                    { title: 'Error 403', to: 'page-error-403' },
                    { title: 'Error 404', to: 'page-error-404' },
                    { title: 'Error 500', to: 'page-error-500' },
                    { title: 'Error 503', to: 'page-error-503' },
                ]
            },
            { title: 'Lock Screen', to: 'page-lock-screen', },
            { title: 'Empty Page', to: 'empty-page', }
        ]
    },
]