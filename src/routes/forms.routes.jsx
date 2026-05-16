import Element from '../pages/forms/Element/Element';
import Wizard from '../pages/forms/Wizard/Wizard';
import CkEditor from '../pages/forms/CkEditor/CkEditor';
import Pickers from '../pages/forms/Pickers/Pickers';
import FormValidation from '../pages/forms/FormValidation/FormValidation';

export const formsRoutes = [
    { path: '/form-element', element: <Element /> },
    { path: '/form-wizard', element: <Wizard /> },
    { path: '/form-ckeditor', element: <CkEditor /> },
    { path: '/form-pickers', element: <Pickers /> },
    { path: '/form-validation', element: <FormValidation /> },
];
