import { toast as _toast } from 'react-toastify';

const defaultOpts = {
    position: 'top-right',
    autoClose: 8000,
    closeOnClick: false,
    pauseOnFocusLoss: false,
    pauseOnHover: true,
    draggable: false,
};

export const toast = {
    success: (msg, extra = {}) => _toast.success(msg, { ...defaultOpts, ...extra }),
    error:   (msg, extra = {}) => _toast.error(msg,   { ...defaultOpts, autoClose: 8000, ...extra }),
    info:    (msg, extra = {}) => _toast.info(msg,    { ...defaultOpts, ...extra }),
    warn:    (msg, extra = {}) => _toast.warn(msg,    { ...defaultOpts, autoClose: 8000, ...extra }),
};
