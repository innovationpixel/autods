import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuCircle,
  LuCircleAlert,
  LuCircleCheck,
  LuEye,
  LuEyeOff,
  LuLoader,
  LuLock,
  LuMail,
  LuRefreshCcw,
  LuShieldCheck,
  LuSparkles,
} from "react-icons/lu";
import {
  getStoredToken,
  resetPasswordWithCode,
  sendPasswordResetCode,
  verifyPasswordResetCode,
} from "../../services/AuthService";
import { isValidEmail, parseApiErrors } from "../../utils/apiErrors";
import { toast } from "../../utils/toast";
import "../../assets/css/auth-page.css";

const recoveryHighlights = [
  { icon: LuMail, text: "Receive a 6-digit verification code at your email" },
  { icon: LuShieldCheck, text: "Verify code ownership within the 15-minute window" },
  { icon: LuLock, text: "Choose a strong new password and sign right back in" },
];

const recoverySteps = [
  { number: 1, label: "Email" },
  { number: 2, label: "Verify Code" },
  { number: 3, label: "New Password" },
];

function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Steps: 1 = Enter Email, 2 = Verify 6-digit Code, 3 = Set New Password, 4 = Done
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [infoBanner, setInfoBanner] = useState("");

  useEffect(() => {
    if (getStoredToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const passwordCriteria = useMemo(
    () => ({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numberOrSpecial: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password.length > 0 && password === passwordConfirmation,
    }),
    [password, passwordConfirmation],
  );

  const passwordStrengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.lowercase) score++;
    if (passwordCriteria.uppercase) score++;
    if (passwordCriteria.numberOrSpecial) score++;
    return score;
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (password.length === 0) return "";
    switch (passwordStrengthScore) {
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "Too short";
    }
  }, [password, passwordStrengthScore]);

  const clearErrors = (field) => {
    setErrorMessage("");
    if (field) {
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors({ email: "Email address is required." });
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendPasswordResetCode(trimmedEmail);
      const ttl = res.data?.expires_in_minutes || 15;
      setCode("");
      setResetToken("");
      setInfoBanner(
        res.data?.message ||
          `A 6-digit verification code has been sent to ${trimmedEmail}. It expires in ${ttl} minutes.`,
      );
      setResendCooldown(30);
      setStep(2);
      toast.success("Verification code sent to your email.");
    } catch (err) {
      const parsed = parseApiErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(
        Object.keys(parsed.fieldErrors).length === 0
          ? parsed.message
          : parsed.message || "Please check the email entered.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resending || resendCooldown > 0 || !email.trim()) {
      return;
    }

    setErrorMessage("");
    setFieldErrors({});
    setResending(true);

    try {
      const res = await sendPasswordResetCode(email.trim());
      const ttl = res.data?.expires_in_minutes || 15;
      setCode("");
      setInfoBanner(
        `A fresh 6-digit verification code was sent to ${email.trim()} (valid for ${ttl} minutes).`,
      );
      setResendCooldown(30);
      toast.success("New verification code sent.");
    } catch (err) {
      const parsed = parseApiErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const digitsOnly = code.replace(/\D/g, "");
    if (digitsOnly.length !== 6) {
      setFieldErrors({ code: "Enter the 6-digit verification code sent to your email." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyPasswordResetCode(email.trim(), digitsOnly);
      if (!res.data?.reset_token) {
        setErrorMessage("Verification failed. Please request a fresh code.");
        return;
      }

      setResetToken(res.data.reset_token);
      setInfoBanner(res.data?.message || "Email verified. Enter your new password below.");
      setStep(3);
      toast.success("Email code verified!");
    } catch (err) {
      const parsed = parseApiErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const nextErrors = {};
    if (!password || password.length < 8) {
      nextErrors.password = "New password must be at least 8 characters.";
    }
    if (!passwordConfirmation) {
      nextErrors.password_confirmation = "Please confirm your new password.";
    } else if (password !== passwordConfirmation) {
      nextErrors.password_confirmation = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPasswordWithCode({
        email: email.trim(),
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });

      setStep(4);
      setInfoBanner(
        res.data?.message ||
          "Your password has been reset successfully. You can now sign in with your new password.",
      );
      toast.success("Password updated successfully!");
    } catch (err) {
      const parsed = parseApiErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  const headingCopy = useMemo(() => {
    if (step === 1) {
      return {
        title: "Forgot your password?",
        subtitle: "Enter your account email and we will send a 6-digit verification code.",
      };
    }
    if (step === 2) {
      return {
        title: "Verify your email",
        subtitle: `Enter the 6-digit code we sent to ${email.trim() || "your email"}.`,
      };
    }
    if (step === 3) {
      return {
        title: "Create a new password",
        subtitle: "Your email is verified. Choose a new password to secure your account.",
      };
    }
    return {
      title: "Password reset complete",
      subtitle: "Your AutoDropshipPrime password has been changed.",
    };
  }, [step, email]);

  const activeErrorItems = Object.entries(fieldErrors).map(([field, message]) => ({
    field,
    message,
  }));

  return (
    <div className="auth-page">
      <aside className="auth-page__brand">
        <div className="auth-page__brand-inner">
          <Link to="/" className="auth-page__logo">
            <img src="/autoprime-logo.png" alt="AutoDropshipPrime" />
          </Link>

          <div className="auth-page__brand-copy">
            <span className="auth-page__eyebrow">
              <LuSparkles />
              Account Recovery
            </span>
            <h1>Reset your password securely</h1>
            <p>
              Verify email ownership with a one-time security code before choosing your new
              AutoDropshipPrime portal password.
            </p>
          </div>

          <ul className="auth-page__features">
            {recoveryHighlights.map((item) => (
              <li key={item.text}>
                <span className="auth-page__feature-icon"><item.icon /></span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-page__brand-glow" aria-hidden="true" />
      </aside>

      <main className="auth-page__main">
        <div className="auth-page__card">
          <div className="auth-page__card-head">
            <h2>{headingCopy.title}</h2>
            <p>{headingCopy.subtitle}</p>
          </div>

          {step < 4 ? (
            <div className="auth-reset-steps" aria-label="Password recovery progress">
              {recoverySteps.map((item) => {
                const isDone = step > item.number;
                const isActive = step === item.number;
                return (
                  <div
                    key={item.number}
                    className={`auth-reset-step ${
                      isDone
                        ? "auth-reset-step--done"
                        : isActive
                        ? "auth-reset-step--active"
                        : ""
                    }`}
                  >
                    <span className="auth-reset-step__num">
                      {isDone ? <LuCheck /> : item.number}
                    </span>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {infoBanner && step > 1 && step < 4 && !errorMessage && activeErrorItems.length === 0 ? (
            <div className="auth-page__alert auth-reset-alert-ok" role="status">
              <LuCircleCheck />
              <div>
                <strong>{infoBanner}</strong>
              </div>
            </div>
          ) : null}

          {(errorMessage || activeErrorItems.length > 0) && step < 4 ? (
            <div className="auth-page__alert auth-page__alert--error" role="alert">
              <LuCircleAlert />
              <div>
                <strong>{errorMessage || "Please check the fields below:"}</strong>
                {activeErrorItems.length > 0 ? (
                  <ul className="auth-page__alert-list">
                    {activeErrorItems.map(({ field, message }) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <form className="auth-page__form" onSubmit={handleSendCode} noValidate>
              <label className={`auth-page__field ${fieldErrors.email ? "auth-page__field--error" : ""}`}>
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
                      clearErrors("email");
                    }}
                    placeholder="you@company.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                </div>
                {fieldErrors.email ? (
                  <span className="auth-page__field-error">{fieldErrors.email}</span>
                ) : null}
              </label>

              <button type="submit" className="auth-page__submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LuLoader className="spin-icon" />
                    <span>Sending verification code…</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <LuArrowRight />
                  </>
                )}
              </button>
            </form>
          ) : null}

          {step === 2 ? (
            <form className="auth-page__form" onSubmit={handleVerifyCode} noValidate>
              <label className={`auth-page__field ${fieldErrors.code ? "auth-page__field--error" : ""}`}>
                <span>6-Digit Verification Code</span>
                <div className="auth-page__input-wrap">
                  <LuShieldCheck />
                  <input
                    type="text"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="auth-reset-code-input"
                    value={code}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(digits);
                      clearErrors("code");
                    }}
                    placeholder="000000"
                    aria-invalid={Boolean(fieldErrors.code)}
                  />
                </div>
                {fieldErrors.code ? (
                  <span className="auth-page__field-error">{fieldErrors.code}</span>
                ) : null}
              </label>

              <button type="submit" className="auth-page__submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LuLoader className="spin-icon" />
                    <span>Verifying code…</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <LuArrowRight />
                  </>
                )}
              </button>

              <div className="auth-reset-secondary-row">
                <button
                  type="button"
                  className="auth-reset-link-btn"
                  onClick={handleResendCode}
                  disabled={resending || resendCooldown > 0}
                >
                  <LuRefreshCcw />
                  <span>
                    {resending
                      ? "Sending…"
                      : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend verification code"}
                  </span>
                </button>

                <button
                  type="button"
                  className="auth-reset-link-btn"
                  onClick={() => {
                    setStep(1);
                    setErrorMessage("");
                    setFieldErrors({});
                  }}
                >
                  <LuArrowLeft />
                  <span>Change email</span>
                </button>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <>
              <div className="auth-reset-verified-pill">
                <LuCircleCheck />
                <span>Verified: {email.trim()}</span>
              </div>

              <form className="auth-page__form" onSubmit={handleResetPassword} noValidate>
                <div className={`auth-page__field ${fieldErrors.password ? "auth-page__field--error" : ""}`}>
                  <label htmlFor="forgot-new-password" className="auth-field-header">
                    <span>New Password</span>
                  </label>
                  <div className="auth-page__input-wrap">
                    <LuLock />
                    <input
                      id="forgot-new-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearErrors("password");
                      }}
                      placeholder="Minimum 8 characters"
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button
                      type="button"
                      className="auth-page__toggle-password"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <LuEyeOff /> : <LuEye />}
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <span className="auth-page__field-error">{fieldErrors.password}</span>
                  ) : null}

                  {password.length > 0 ? (
                    <div className="password-strength">
                      <div className="password-strength__bar-wrapper">
                        <div className={`password-strength__bar password-strength__bar--${passwordStrengthScore}`} />
                      </div>
                      <div className="password-strength__meta">
                        <span>Password strength</span>
                        <span>{passwordStrengthLabel}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div
                  className={`auth-page__field ${
                    fieldErrors.password_confirmation ? "auth-page__field--error" : ""
                  }`}
                >
                  <label htmlFor="forgot-confirm-password" className="auth-field-header">
                    <span>Confirm New Password</span>
                  </label>
                  <div className="auth-page__input-wrap">
                    <LuLock />
                    <input
                      id="forgot-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirmation"
                      autoComplete="new-password"
                      value={passwordConfirmation}
                      onChange={(event) => {
                        setPasswordConfirmation(event.target.value);
                        clearErrors("password_confirmation");
                      }}
                      placeholder="Re-enter your new password"
                      aria-invalid={Boolean(fieldErrors.password_confirmation)}
                    />
                    <button
                      type="button"
                      className="auth-page__toggle-password"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <LuEyeOff /> : <LuEye />}
                    </button>
                  </div>
                  {fieldErrors.password_confirmation ? (
                    <span className="auth-page__field-error">{fieldErrors.password_confirmation}</span>
                  ) : null}
                </div>

                <div className="restrictions-checklist">
                  <div className={`restriction-item ${passwordCriteria.length ? "restriction-item--valid" : ""}`}>
                    {passwordCriteria.length ? <LuCheck /> : <LuCircle />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`restriction-item ${passwordCriteria.uppercase ? "restriction-item--valid" : ""}`}>
                    {passwordCriteria.uppercase ? <LuCheck /> : <LuCircle />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`restriction-item ${passwordCriteria.numberOrSpecial ? "restriction-item--valid" : ""}`}>
                    {passwordCriteria.numberOrSpecial ? <LuCheck /> : <LuCircle />}
                    <span>Number or symbol</span>
                  </div>
                  <div className={`restriction-item ${passwordCriteria.match ? "restriction-item--valid" : ""}`}>
                    {passwordCriteria.match ? <LuCheck /> : <LuCircle />}
                    <span>Passwords match</span>
                  </div>
                </div>

                <button type="submit" className="auth-page__submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LuLoader className="spin-icon" />
                      <span>Updating password…</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <LuArrowRight />
                    </>
                  )}
                </button>

                {fieldErrors.reset_token ? (
                  <div className="auth-reset-secondary-row">
                    <button
                      type="button"
                      className="auth-reset-link-btn"
                      onClick={() => {
                        setStep(1);
                        setResetToken("");
                        setErrorMessage("");
                        setFieldErrors({});
                      }}
                    >
                      <LuArrowLeft />
                      <span>Request a new verification code</span>
                    </button>
                  </div>
                ) : null}
              </form>
            </>
          ) : null}

          {step === 4 ? (
            <div className="auth-reset-complete-box">
              <div className="auth-reset-complete-icon">
                <LuShieldCheck />
              </div>
              <h3>Your password is updated</h3>
              <p>
                {infoBanner ||
                  "You can now sign in to your AutoDropshipPrime dashboard with your new password."}
              </p>
              <Link to="/user/login" className="auth-page__submit auth-reset-complete-cta">
                <span>Back to Sign In</span>
                <LuArrowRight />
              </Link>
            </div>
          ) : null}

          <div className="auth-page__card-foot">
            <p>
              Remembered your password?{" "}
              <Link to="/user/login">Return to Sign In</Link>
            </p>
          </div>

          <div className="auth-page__trust">
            <span><LuCheck /> Email OTP verification</span>
            <span><LuCheck /> Encrypted reset token</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
