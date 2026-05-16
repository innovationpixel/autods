import Select2 from '../pages/plugins/Select2/Select2';
import NouiSlider from '../pages/plugins/NouiSlider/MainNouiSlider';
import MainSweetAlert from '../pages/plugins/SweetAlert/SweetAlert';
import MainToastr from '../pages/plugins/Toastr/Toastr';
import Lightgallery from '../pages/plugins/Lightgallery/Lightgallery';

export const pluginsRoutes = [
    { path: '/uc-select2', element: <Select2 /> },
    { path: '/uc-noui-slider', element: <NouiSlider /> },
    { path: '/uc-sweetalert', element: <MainSweetAlert /> },
    { path: '/uc-toastr', element: <MainToastr /> },
    { path: '/uc-lightgallery', element: <Lightgallery /> },
];
