import UiAccordion from '../components/bootstrap/Accordion';
import UiAlert from '../components/bootstrap/Alert';
import UiBadge from '../components/bootstrap/Badge';
import UiButton from '../components/bootstrap/Button';
import UiModal from '../components/bootstrap/Modal';
import UiButtonGroup from '../components/bootstrap/ButtonGroup';
import UiListGroup from '../components/bootstrap/ListGroup';
import UiCards from '../components/bootstrap/Cards';
import UiCarousel from '../components/bootstrap/Carousel';
import UiDropDown from '../components/bootstrap/DropDown';
import UiPopOver from '../components/bootstrap/PopOver';
import UiProgressBar from '../components/bootstrap/ProgressBar';
import UiTab from '../components/bootstrap/Tab';
import UiTypography from '../components/bootstrap/Typography';
import UiPagination from '../components/bootstrap/Pagination';
import UiGrid from '../components/bootstrap/Grid';

export const bootstrapRoutes = [
    { path: '/ui-accordion', element: <UiAccordion /> },
    { path: '/ui-alert', element: <UiAlert /> },
    { path: '/ui-badge', element: <UiBadge /> },
    { path: '/ui-button', element: <UiButton /> },
    { path: '/ui-modal', element: <UiModal /> },
    { path: '/ui-button-group', element: <UiButtonGroup /> },
    { path: '/ui-list-group', element: <UiListGroup /> },
    { path: '/ui-card', element: <UiCards /> },
    { path: '/ui-carousel', element: <UiCarousel /> },
    { path: '/ui-dropdown', element: <UiDropDown /> },
    { path: '/ui-popover', element: <UiPopOver /> },
    { path: '/ui-progressbar', element: <UiProgressBar /> },
    { path: '/ui-tab', element: <UiTab /> },
    { path: '/ui-typography', element: <UiTypography /> },
    { path: '/ui-pagination', element: <UiPagination /> },
    { path: '/ui-grid', element: <UiGrid /> },
];
