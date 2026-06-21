import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  LuCircleAlert,
  LuArrowRight,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuLoader,
  LuLock,
  LuMail,
  LuPackage,
  LuRefreshCcw,
  LuSparkles,
  LuStore,
} from "react-icons/lu";
import {
  clearAuthErrorsAction,
  loginAction,
} from "../../store/actions/AuthActions";
import { getStoredToken } from "../../services/AuthService";
import { isValidEmail } from "../../utils/apiErrors";
import logo from "../../assets/images/logo-full.png";
import "../../assets/css/auth-page.css";

const featureItems = [
  { icon: LuStore, text: "Connect eBay & AliExpress in minutes" },
  { icon: LuPackage, text: "Import products and publish listings automatically" },
  { icon: LuRefreshCcw, text: "Sync orders, pricing, and inventory in one place" },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState({});
  const [dismissedApiFields, setDismissedApiFields] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const errorMessage = useSelector((state) => state.auth.errorMessage);
  const apiFieldErrors = useSelector((state) => state.auth.fieldErrors);
  const showLoading = useSelector((state) => state.auth.showLoading);

  useEffect(() => {
    if (getStoredToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const visibleApiFieldErrors = useMemo(() => {
    const next = { ...apiFieldErrors };
    dismissedApiFields.forEach((field) => {
      delete next[field];
    });
    return next;
  }, [apiFieldErrors, dismissedApiFields]);

  const fieldErrors = useMemo(() => ({
    ...visibleApiFieldErrors,
    ...clientErrors,
  }), [visibleApiFieldErrors, clientErrors]);

  const apiErrorList = useMemo(
    () => Object.entries(visibleApiFieldErrors).map(([field, message]) => ({ field, message })),
    [visibleApiFieldErrors],
  );

  const clearFieldError = (field) => {
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (apiFieldErrors[field]) {
      setDismissedApiFields((current) => [...new Set([...current, field])]);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(clearAuthErrorsAction());
    setClientErrors({});
    setDismissedApiFields([]);

    if (!validateForm()) {
      return;
    }

    dispatch(loginAction(email.trim(), password, navigate));
  };

  const getFieldError = (field) => fieldErrors[field] ?? "";

  return (
    <div className="auth-page">
      <aside className="auth-page__brand">
        <div className="auth-page__brand-inner">
          <Link to="/" className="auth-page__logo">
            <img src={logo} alt="Auto DS" />
          </Link>

          <div className="auth-page__brand-copy">
            <span className="auth-page__eyebrow">
              <LuSparkles />
              Dropshipping automation
            </span>
            <h1>Run your store smarter, not harder</h1>
            <p>
              Auto DS connects your suppliers and marketplaces so you can import,
              list, and fulfill orders from a single dashboard.
            </p>
          </div>

          <ul className="auth-page__features">
            {featureItems.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="auth-page__feature-icon"><Icon /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-page__brand-glow" aria-hidden="true" />
      </aside>

      <main className="auth-page__main">
        <div className="auth-page__card">
          <div className="auth-page__card-head">
            <h2>Sign in to your account</h2>
            <p>Welcome back. Enter your credentials to continue.</p>
          </div>

          {(errorMessage || apiErrorList.length > 0) ? (
            <div className="auth-page__alert auth-page__alert--error" role="alert">
              <LuCircleAlert />
              <div>
                <strong>{errorMessage || "Please fix the following:"}</strong>
                {apiErrorList.length > 0 ? (
                  <ul className="auth-page__alert-list">
                    {apiErrorList.map(({ field, message }) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          <form className="auth-page__form" onSubmit={onSubmit} noValidate>
            <label className={`auth-page__field ${getFieldError("email") ? "auth-page__field--error" : ""}`}>
              <span>Email address</span>
              <div className="auth-page__input-wrap">
                <LuMail />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearFieldError("email");
                  }}
                  placeholder="you@company.com"
                  aria-invalid={Boolean(getFieldError("email"))}
                  aria-describedby={getFieldError("email") ? "login-email-error" : undefined}
                />
              </div>
              {getFieldError("email") ? (
                <span className="auth-page__field-error" id="login-email-error">{getFieldError("email")}</span>
              ) : null}
            </label>

            <label className={`auth-page__field ${getFieldError("password") ? "auth-page__field--error" : ""}`}>
              <span>Password</span>
              <div className="auth-page__input-wrap">
                <LuLock />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(getFieldError("password"))}
                  aria-describedby={getFieldError("password") ? "login-password-error" : undefined}
                />
                <button
                  type="button"
                  className="auth-page__toggle-password"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </button>
              </div>
              {getFieldError("password") ? (
                <span className="auth-page__field-error" id="login-password-error">{getFieldError("password")}</span>
              ) : null}
            </label>

            <button
              type="submit"
              className="auth-page__submit"
              disabled={showLoading}
            >
              {showLoading ? (
                <>
                  <LuLoader className="spin-icon" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LuArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="auth-page__trust">
            <span><LuCheck /> Secure sign-in</span>
            <span><LuCheck /> Encrypted credentials</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
