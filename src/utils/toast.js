import { toast as _toast } from 'react-toastify';

const opts = { position: 'top-right', autoClose: 3500 };

export const toast = {
    success: (msg, extra = {}) => _toast.success(msg, { ...opts, ...extra }),
    error:   (msg, extra = {}) => _toast.error(msg,   { ...opts, autoClose: 5000, ...extra }),
    info:    (msg, extra = {}) => _toast.info(msg,    { ...opts, ...extra }),
    warn:    (msg, extra = {}) => _toast.warn(msg,    { ...opts, ...extra }),
};
