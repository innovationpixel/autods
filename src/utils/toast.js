import { toast as _toast } from 'react-toastify';

const defaultOpts = {
    position: 'top-right',
    autoClose: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: false,
    pauseOnHover: true,
    draggable: false,
};

export const toast = {
    success: (msg, extra = {}) => _toast.success(msg, { ...defaultOpts, autoClose: 5000, ...extra }),
    error:   (msg, extra = {}) => _toast.error(msg,   { ...defaultOpts, autoClose: 8000, ...extra }),
    info:    (msg, extra = {}) => _toast.info(msg,    { ...defaultOpts, autoClose: 5000, ...extra }),
    warn:    (msg, extra = {}) => _toast.warn(msg,    { ...defaultOpts, autoClose: 6000, ...extra }),
};
