import { toast as _toast } from 'react-toastify';

const defaultOpts = {
    position: 'top-right',
    autoClose: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: false,
    pauseOnHover: true,
    draggable: false,
};

function triggerToast(type, msg, extra = {}) {
    const opts = { ...defaultOpts, autoClose: 5000, ...extra };

    // If a toastId was passed and is currently active on screen, smoothly update it
    // and reset its autoClose countdown so it doesn't get dismissed prematurely.
    if (opts.toastId && _toast.isActive(opts.toastId)) {
        return _toast.update(opts.toastId, {
            render: msg,
            type: type === 'warn' ? 'warning' : (type === 'default' ? 'default' : type),
            isLoading: false,
            autoClose: opts.autoClose ?? 5000,
            ...opts,
        });
    }

    if (type === 'success') return _toast.success(msg, opts);
    if (type === 'error')   return _toast.error(msg, { ...opts, autoClose: opts.autoClose ?? 8000 });
    if (type === 'warn')    return _toast.warn(msg, { ...opts, autoClose: opts.autoClose ?? 6000 });
    if (type === 'info')    return _toast.info(msg, opts);
    return _toast(msg, opts);
}

export const toast = Object.assign(
    (msg, extra = {}) => triggerToast('default', msg, extra),
    _toast,
    {
        success: (msg, extra = {}) => triggerToast('success', msg, extra),
        error:   (msg, extra = {}) => triggerToast('error',   msg, extra),
        info:    (msg, extra = {}) => triggerToast('info',    msg, extra),
        warn:    (msg, extra = {}) => triggerToast('warn',    msg, extra),
    }
);
