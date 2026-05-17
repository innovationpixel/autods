import { toast as _toast } from 'react-toastify';

const opts = { position: 'top-right', autoClose: 3500 };

export const toast = {
    success: (msg) => _toast.success(msg, opts),
    error:   (msg) => _toast.error(msg,   { ...opts, autoClose: 5000 }),
    info:    (msg) => _toast.info(msg,    opts),
    warn:    (msg) => _toast.warn(msg,    opts),
};
