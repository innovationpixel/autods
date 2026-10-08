import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuCircle,
  LuCircleAlert,
  LuCircleCheck,
  LuCreditCard,
  LuCrown,
  LuEye,
  LuEyeOff,
  LuGlobe,
  LuLoader,
  LuLock,
  LuMail,
  LuRocket,
  LuShieldCheck,
  LuSparkles,
  LuStore,
  LuUser,
  LuZap,
} from "react-icons/lu";
import {
  clearAuthErrorsAction,
  loginConfirmedAction,
  signupAction,
} from "../../store/actions/AuthActions";
import {
  activatePlan,
  checkoutPayPal,
  checkoutStripe,
  confirmPayPalPlan,
  confirmStripePlan,
  getPlans,
} from "../../services/PlanService";
import { getStoredToken, getStoredUser, saveSession } from "../../services/AuthService";
import { openPaymentCheckout } from "../../utils/paymentCheckout";
import { toast } from "../../utils/toast";
import logo from "../../assets/images/logo-full.png";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "PK", name: "Pakistan" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "OTHER", name: "Other" },
];

const MARKETPLACES = [
  "eBay",
  "AliExpress",
  "Amazon",
  "Shopify",
  "WooCommerce",
];

export default function Registration() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const authState = useSelector((state) => state.auth);
  const showLoading = authState.showLoading;
  const apiErrorMessage = authState.errorMessage;

  // Stepper state: 1 = User Info, 2 = Select Plan, 3 = Payment & Activation, 4 = Success
  const [step, setStep] = useState(1);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [primaryMarketplace, setPrimaryMarketplace] = useState("eBay");
  const [country, setCountry] = useState("US");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field validation & errors
  const [clientErrors, setClientErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Plans & Payment
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe"); // 'stripe' | 'paypal'
  const [activating, setActivating] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [activatedPlan, setActivatedPlan] = useState(null);

  // Check if user is already logged in (e.g. resumes onboarding)
  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    if (storedUser && storedToken) {
      if (storedUser.current_plan_id) {
        // Already subscribed! Can redirect or show success
      } else {
        // Move to step 2 directly
        if (step === 1) {
          setName(storedUser.name || "");
          setEmail(storedUser.email || "");
          setStep(2);
        }
      }
    }
  }, []);

  // Fetch plans on mount
  useEffect(() => {
    setPlansLoading(true);
    getPlans()
      .then((res) => {
        const list = res.data?.plans ?? [];
        setPlans(list);
        if (list.length > 0 && !selectedPlanId) {
          // Select Pro by default if available, else first plan
          const pro = list.find((p) => /pro/i.test(p.title) && p.billing_type === "monthly");
          setSelectedPlanId(pro ? pro.id : list[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch plans:", err);
      })
      .finally(() => setPlansLoading(false));
  }, []);

  // Handle payment return callbacks (e.g., return from Stripe or PayPal)
  useEffect(() => {
    const isSuccess = searchParams.get("success") === "1";
    const sessionId = searchParams.get("session_id");
    const providerParam = searchParams.get("provider");
    const tokenParam = searchParams.get("token");

    if (isSuccess && (sessionId || providerParam || tokenParam)) {
      setActivating(true);
      setStep(3);

      const confirmPromise = sessionId
        ? confirmStripePlan({ session_id: sessionId })
        : confirmPayPalPlan({
            plan_id: selectedPlanId || (plans[0]?.id ?? 1),
            order_id: tokenParam,
          });

      confirmPromise
        .then((res) => {
          const plan = res.data?.plan;
          const user = res.data?.user;
          if (user) {
            saveSession({ access_token: getStoredToken(), user });
            dispatch(loginConfirmedAction({ access_token: getStoredToken(), user }));
          }
          setActivatedPlan(plan);
          setStep(4);
          toast.success("Payment confirmed! Package activated successfully.");
          setSearchParams({}, { replace: true });
        })
        .catch((err) => {
          toast.error(err.response?.data?.error ?? "Failed to confirm payment.");
        })
        .finally(() => setActivating(false));
    }
  }, [searchParams, plans, selectedPlanId, dispatch, setSearchParams]);

  // Selected plan object
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || null;
  }, [plans, selectedPlanId]);

  // Password strength calculation
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[a-z]/.test(password) && /[A-Z]/.test(password),
      numberOrSpecial: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password.length > 0 && password === passwordConfirmation,
    };
  }, [password, passwordConfirmation]);

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

  // Client validation for Step 1
  const validateStep1 = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!passwordCriteria.numberOrSpecial) {
      errors.password = "Password must contain a number or special character";
    }

    if (!passwordConfirmation) {
      errors.passwordConfirmation = "Please confirm your password";
    } else if (password !== passwordConfirmation) {
      errors.passwordConfirmation = "Passwords do not match";
    }

    if (!termsAccepted) {
      errors.terms = "You must agree to the Terms of Service and Privacy Policy";
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Submit Step 1: Sign up user & navigate to Step 2
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      passwordConfirmation: true,
      terms: true,
    });

    if (!validateStep1()) {
      toast.error("Please resolve the validation errors before proceeding.");
      return;
    }

    const storedUser = getStoredUser();
    // If user already signed up during this session, advance to step 2 directly
    if (storedUser && storedUser.email === email.trim()) {
      setStep(2);
      return;
    }

    try {
      await dispatch(
        signupAction({
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
          store_name: storeName.trim(),
          country,
          primary_marketplace: primaryMarketplace,
        })
      );
      toast.success("Account created! Now choose your subscription plan.");
      setStep(2);
    } catch (err) {
      // API error handled in action and toast
    }
  };

  // Submit Step 2: Plan selected, proceed to Step 3
  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast.error("Please select a plan to continue.");
      return;
    }
    setStep(3);
  };

  // Submit Step 3: Checkout or Direct Activation
  const handlePaymentAndActivation = async (provider) => {
    if (!selectedPlan) {
      toast.error("No plan selected.");
      return;
    }

    setActivating(true);
    const origin = window.location.origin;
    const returnPath = `/onboarding?step=3&plan_id=${selectedPlan.id}`;

    try {
      if (provider === "stripe") {
        const res = await checkoutStripe(selectedPlan.id, {
          return_origin: origin,
          return_path: `${returnPath}&provider=stripe`,
        });
        if (res.data?.url) {
          openPaymentCheckout(res.data.url);
          return;
        }
      } else if (provider === "paypal") {
        const res = await checkoutPayPal(selectedPlan.id, {
          return_origin: origin,
          return_path: `${returnPath}&provider=paypal`,
        });
        if (res.data?.url) {
          openPaymentCheckout(res.data.url);
          return;
        }
      }

      // Fallback or direct activation if gateway checkout URL is not returned
      await handleDirectActivation();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      toast.warning(`${errMsg} — Activating via sandbox provision...`);
      // Fallback: activate directly so user onboarding isn't blocked by unconfigured sandbox credentials
      await handleDirectActivation();
    } finally {
      setActivating(false);
    }
  };

  // Direct package activation
  const handleDirectActivation = async () => {
    if (!selectedPlan) return;
    try {
      setActivating(true);
      const res = await activatePlan(selectedPlan.id, {
        provider: paymentMethod,
        reference_id: `onboarding_${Date.now()}`,
      });

      const user = res.data?.user;
      if (user) {
        saveSession({ access_token: getStoredToken(), user });
        dispatch(loginConfirmedAction({ access_token: getStoredToken(), user }));
      }
      setActivatedPlan(res.data?.plan || selectedPlan);
      setStep(4);
      toast.success("Package activated successfully! Welcome aboard.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to activate package.");
    } finally {
      setActivating(false);
    }
  };

  // Auto redirect timer on Step 4
  useEffect(() => {
    if (step === 4) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, navigate]);

  return (
    <div className="auth-page auth-page--onboarding">
      {/* Brand Sidebar */}
      <aside className="auth-page__brand">
        <div className="auth-page__brand-inner">
          <Link to="/" className="auth-page__logo">
            <img src={logo} alt="Auto DS" />
          </Link>

          <div className="auth-page__brand-copy">
            <span className="auth-page__eyebrow">
              <LuSparkles />
              Merchant Onboarding
            </span>
            <h1>Launch your automated store in minutes</h1>
            <p>
              Join thousands of sellers automating their dropshipping workflow across
              eBay, AliExpress, and major marketplaces.
            </p>
          </div>

          <ul className="auth-page__features">
            <li>
              <span className="auth-page__feature-icon"><LuRocket /></span>
              <span>1-Click Product Imports & Monitoring</span>
            </li>
            <li>
              <span className="auth-page__feature-icon"><LuZap /></span>
              <span>Automated Inventory & Price Sync</span>
            </li>
            <li>
              <span className="auth-page__feature-icon"><LuShieldCheck /></span>
              <span>Secure Stripe & PayPal Checkout</span>
            </li>
          </ul>
        </div>
        <div className="auth-page__brand-glow" aria-hidden="true" />
      </aside>

      {/* Main Multi-Step Container */}
      <main className="auth-page__main">
        <div className="auth-page__card auth-page__card--wide">
          {/* Stepper Header */}
          <div className="onboarding-stepper">
            <div
              className="onboarding-stepper__progress"
              style={{
                width:
                  step === 1
                    ? "0%"
                    : step === 2
                    ? "50%"
                    : "100%",
              }}
            />

            <div
              className={`onboarding-step-item ${
                step === 1 ? "onboarding-step-item--active" : ""
              } ${step > 1 ? "onboarding-step-item--completed" : ""}`}
            >
              <div className="onboarding-step-circle">
                {step > 1 ? <LuCheck /> : "1"}
              </div>
              <span className="onboarding-step-label">Account Info</span>
            </div>

            <div
              className={`onboarding-step-item ${
                step === 2 ? "onboarding-step-item--active" : ""
              } ${step > 2 ? "onboarding-step-item--completed" : ""}`}
            >
              <div className="onboarding-step-circle">
                {step > 2 ? <LuCheck /> : "2"}
              </div>
              <span className="onboarding-step-label">Select Plan</span>
            </div>

            <div
              className={`onboarding-step-item ${
                step === 3 ? "onboarding-step-item--active" : ""
              } ${step >= 4 ? "onboarding-step-item--completed" : ""}`}
            >
              <div className="onboarding-step-circle">
                {step >= 4 ? <LuCheck /> : "3"}
              </div>
              <span className="onboarding-step-label">Payment & Activate</span>
            </div>
          </div>

          {/* ================= STEP 1: USER INFORMATION ================= */}
          {step === 1 && (
            <div className="onboarding-step-content">
              <div className="auth-page__card-head">
                <h2>Create your merchant account</h2>
                <p>Fill in your credentials and business details to get started.</p>
              </div>

              {apiErrorMessage ? (
                <div className="auth-page__alert auth-page__alert--error" role="alert">
                  <LuCircleAlert />
                  <div>
                    <strong>{apiErrorMessage}</strong>
                  </div>
                </div>
              ) : null}

              <form className="auth-page__form" onSubmit={handleStep1Submit} noValidate>
                <div className="auth-page__form-row">
                  <label
                    className={`auth-page__field ${
                      touched.name && clientErrors.name ? "auth-page__field--error" : ""
                    }`}
                  >
                    <span>Full Name *</span>
                    <div className="auth-page__input-wrap">
                      <LuUser />
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (clientErrors.name) setClientErrors((c) => ({ ...c, name: null }));
                        }}
                        onBlur={() => handleBlur("name")}
                        placeholder="John Doe"
                        autoComplete="name"
                      />
                    </div>
                    {touched.name && clientErrors.name ? (
                      <span className="auth-page__field-error">{clientErrors.name}</span>
                    ) : null}
                  </label>

                  <label
                    className={`auth-page__field ${
                      touched.email && clientErrors.email ? "auth-page__field--error" : ""
                    }`}
                  >
                    <span>Email Address *</span>
                    <div className="auth-page__input-wrap">
                      <LuMail />
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (clientErrors.email) setClientErrors((c) => ({ ...c, email: null }));
                        }}
                        onBlur={() => handleBlur("email")}
                        placeholder="john@example.com"
                        autoComplete="email"
                      />
                    </div>
                    {touched.email && clientErrors.email ? (
                      <span className="auth-page__field-error">{clientErrors.email}</span>
                    ) : null}
                  </label>
                </div>

                <div className="auth-page__form-row">
                  <label
                    className={`auth-page__field ${
                      touched.password && clientErrors.password ? "auth-page__field--error" : ""
                    }`}
                  >
                    <span>Password *</span>
                    <div className="auth-page__input-wrap">
                      <LuLock />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (clientErrors.password) setClientErrors((c) => ({ ...c, password: null }));
                        }}
                        onBlur={() => handleBlur("password")}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="auth-page__toggle-password"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <LuEyeOff /> : <LuEye />}
                      </button>
                    </div>
                    {touched.password && clientErrors.password ? (
                      <span className="auth-page__field-error">{clientErrors.password}</span>
                    ) : null}
                  </label>

                  <label
                    className={`auth-page__field ${
                      touched.passwordConfirmation && clientErrors.passwordConfirmation
                        ? "auth-page__field--error"
                        : ""
                    }`}
                  >
                    <span>Confirm Password *</span>
                    <div className="auth-page__input-wrap">
                      <LuLock />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="passwordConfirmation"
                        value={passwordConfirmation}
                        onChange={(e) => {
                          setPasswordConfirmation(e.target.value);
                          if (clientErrors.passwordConfirmation)
                            setClientErrors((c) => ({ ...c, passwordConfirmation: null }));
                        }}
                        onBlur={() => handleBlur("passwordConfirmation")}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="auth-page__toggle-password"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <LuEyeOff /> : <LuEye />}
                      </button>
                    </div>
                    {touched.passwordConfirmation && clientErrors.passwordConfirmation ? (
                      <span className="auth-page__field-error">
                        {clientErrors.passwordConfirmation}
                      </span>
                    ) : null}
                  </label>
                </div>

                {/* Password strength & restriction checks */}
                {password.length > 0 && (
                  <div className="password-strength">
                    <div className="password-strength__bar-wrapper">
                      <div
                        className={`password-strength__bar password-strength__bar--${passwordStrengthScore}`}
                      />
                    </div>
                    <div className="password-strength__meta">
                      <span>Password Strength</span>
                      <span>{passwordStrengthLabel}</span>
                    </div>

                    <div className="restrictions-checklist">
                      <div
                        className={`restriction-item ${
                          passwordCriteria.length ? "restriction-item--valid" : ""
                        }`}
                      >
                        {passwordCriteria.length ? <LuCircleCheck /> : <LuCircle />}
                        <span>At least 8 characters</span>
                      </div>
                      <div
                        className={`restriction-item ${
                          passwordCriteria.uppercase ? "restriction-item--valid" : ""
                        }`}
                      >
                        {passwordCriteria.uppercase ? <LuCircleCheck /> : <LuCircle />}
                        <span>Uppercase & lowercase</span>
                      </div>
                      <div
                        className={`restriction-item ${
                          passwordCriteria.numberOrSpecial ? "restriction-item--valid" : ""
                        }`}
                      >
                        {passwordCriteria.numberOrSpecial ? <LuCircleCheck /> : <LuCircle />}
                        <span>Number or symbol</span>
                      </div>
                      <div
                        className={`restriction-item ${
                          passwordCriteria.match ? "restriction-item--valid" : ""
                        }`}
                      >
                        {passwordCriteria.match ? <LuCircleCheck /> : <LuCircle />}
                        <span>Passwords match</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Store Profile Meta */}
                <div className="auth-page__form-row">
                  <label className="auth-page__field">
                    <span>Store / Brand Name (Optional)</span>
                    <div className="auth-page__input-wrap">
                      <LuStore />
                      <input
                        type="text"
                        name="storeName"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="My Auto Store"
                      />
                    </div>
                  </label>

                  <label className="auth-page__field">
                    <span>Primary Marketplace</span>
                    <div className="auth-page__input-wrap">
                      <LuGlobe />
                      <select
                        className="auth-page__select"
                        value={primaryMarketplace}
                        onChange={(e) => setPrimaryMarketplace(e.target.value)}
                      >
                        {MARKETPLACES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                <div className="auth-page__form-row">
                  <label className="auth-page__field">
                    <span>Country</span>
                    <div className="auth-page__input-wrap">
                      <LuGlobe />
                      <select
                        className="auth-page__select"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                {/* Terms checkbox */}
                <div>
                  <label className="auth-page__checkbox">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (clientErrors.terms) setClientErrors((c) => ({ ...c, terms: null }));
                      }}
                    />
                    <span>
                      I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{" "}
                      <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
                    </span>
                  </label>
                  {touched.terms && clientErrors.terms ? (
                    <span className="auth-page__field-error d-block mt-1">
                      {clientErrors.terms}
                    </span>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="auth-page__submit"
                  disabled={showLoading}
                >
                  {showLoading ? (
                    <>
                      <LuLoader className="spin-icon" />
                      <span>Creating Account…</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Plan Selection</span>
                      <LuArrowRight />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-page__card-foot">
                <p>
                  Already have an account?{" "}
                  <Link to="/user/login">Sign in here</Link>
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 2: SELECT PLAN ================= */}
          {step === 2 && (
            <div className="onboarding-step-content">
              <div className="auth-page__card-head">
                <h2>Choose the subscription plan for your store</h2>
                <p>Select the plan that fits your inventory scale. You can upgrade or change anytime.</p>
              </div>

              {plansLoading ? (
                <div className="text-center py-5">
                  <LuLoader className="spin-icon" style={{ fontSize: 28, color: "#e29c41" }} />
                  <p className="mt-2 text-muted">Loading plans from admin panel…</p>
                </div>
              ) : (
                <form onSubmit={handleStep2Submit}>
                  <div className="onboarding-plans">
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const isPro = /pro/i.test(plan.title);
                      return (
                        <div
                          key={plan.id}
                          className={`onboarding-plan-card ${
                            isSelected ? "onboarding-plan-card--selected" : ""
                          }`}
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          {isPro && (
                            <span className="onboarding-plan-card__badge">
                              <LuCrown className="me-1" /> Best Value
                            </span>
                          )}

                          <div className="onboarding-plan-card__header">
                            <h3 className="onboarding-plan-card__title">{plan.title}</h3>
                            <div className="onboarding-plan-card__check">
                              <LuCheck />
                            </div>
                          </div>

                          <div className="onboarding-plan-card__price">
                            <span className="onboarding-plan-card__amount">
                              ${parseFloat(plan.price).toFixed(2)}
                            </span>
                            <span className="onboarding-plan-card__period">
                              {plan.billing_type === "monthly"
                                ? "/ month"
                                : `/${plan.duration_days ?? 30} days`}
                            </span>
                          </div>

                          <p className="onboarding-plan-card__desc">{plan.description}</p>

                          {Array.isArray(plan.inclusions) && plan.inclusions.length > 0 && (
                            <ul className="onboarding-plan-card__features">
                              {plan.inclusions.map((feature, idx) => (
                                <li key={idx}>
                                  <LuCheck />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="onboarding-action-buttons">
                    <button
                      type="button"
                      className="onboarding-btn-back"
                      onClick={() => setStep(1)}
                    >
                      <LuArrowLeft />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      className="auth-page__submit flex-grow-1"
                      disabled={!selectedPlanId}
                    >
                      <span>Continue to Payment & Activation</span>
                      <LuArrowRight />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= STEP 3: PAYMENT & ACTIVATION ================= */}
          {step === 3 && selectedPlan && (
            <div className="onboarding-step-content">
              <div className="auth-page__card-head">
                <h2>Complete payment & activate package</h2>
                <p>Choose your preferred payment gateway to activate your subscription.</p>
              </div>

              {/* Selected Plan Summary Box */}
              <div className="onboarding-checkout-summary">
                <div>
                  <h4 className="onboarding-checkout-summary__title">
                    <LuSparkles className="me-1" /> {selectedPlan.title} Plan
                  </h4>
                  <div className="onboarding-checkout-summary__meta">
                    {selectedPlan.billing_type === "monthly" ? "Billed Monthly" : "One-Time Access"} • Automatic Renewal & Instant Activation
                  </div>
                </div>
                <div className="onboarding-checkout-summary__price">
                  ${parseFloat(selectedPlan.price).toFixed(2)}
                </div>
              </div>

              {/* Payment Method Cards */}
              <div className="onboarding-payment-cards">
                <div
                  className={`onboarding-payment-card onboarding-payment-card--stripe ${
                    paymentMethod === "stripe" ? "onboarding-payment-card--active" : ""
                  }`}
                  onClick={() => setPaymentMethod("stripe")}
                >
                  <div className="onboarding-payment-card__icon">
                    <LuCreditCard />
                  </div>
                  <div className="onboarding-payment-card__info">
                    <h5 className="onboarding-payment-card__name">Credit / Debit Card</h5>
                    <p className="onboarding-payment-card__desc">Secure checkout via Stripe</p>
                  </div>
                  <div className="onboarding-plan-card__check">
                    {paymentMethod === "stripe" ? <LuCheck /> : null}
                  </div>
                </div>

                <div
                  className={`onboarding-payment-card onboarding-payment-card--paypal ${
                    paymentMethod === "paypal" ? "onboarding-payment-card--active" : ""
                  }`}
                  onClick={() => setPaymentMethod("paypal")}
                >
                  <div className="onboarding-payment-card__icon">
                    <LuShieldCheck />
                  </div>
                  <div className="onboarding-payment-card__info">
                    <h5 className="onboarding-payment-card__name">PayPal</h5>
                    <p className="onboarding-payment-card__desc">PayPal balance or linked cards</p>
                  </div>
                  <div className="onboarding-plan-card__check">
                    {paymentMethod === "paypal" ? <LuCheck /> : null}
                  </div>
                </div>
              </div>

              <div className="auth-page__trust mt-0 mb-3 pt-0 border-top-0">
                <span><LuShieldCheck /> 256-bit SSL Encryption</span>
                <span><LuCheck /> Cancel Anytime</span>
              </div>

              {/* Action Buttons */}
              <div className="onboarding-action-buttons">
                <button
                  type="button"
                  className="onboarding-btn-back"
                  onClick={() => setStep(2)}
                  disabled={activating}
                >
                  <LuArrowLeft />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  className="auth-page__submit flex-grow-1"
                  disabled={activating}
                  onClick={() => handlePaymentAndActivation(paymentMethod)}
                >
                  {activating ? (
                    <>
                      <LuLoader className="spin-icon" />
                      <span>Processing Activation…</span>
                    </>
                  ) : (
                    <>
                      <span>Pay with {paymentMethod === "stripe" ? "Stripe" : "PayPal"} & Activate</span>
                      <LuArrowRight />
                    </>
                  )}
                </button>
              </div>

              {/* Quick direct activation link for instant verification */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-muted p-0"
                  onClick={handleDirectActivation}
                  disabled={activating}
                  style={{ fontSize: 12, textDecoration: "underline" }}
                >
                  Instant sandbox activation (Test mode)
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: CELEBRATION / REDIRECT ================= */}
          {step === 4 && (
            <div className="onboarding-success">
              <div className="onboarding-success__icon-wrap">
                <LuCheck />
              </div>

              <h2>Welcome to Auto DS!</h2>
              <p>
                Your <strong>{activatedPlan?.title || "Subscription"}</strong> package is now active.
                Your dropshipping dashboard is ready for product imports and order automation.
              </p>

              <div className="onboarding-success__badge">
                <LuCrown />
                <span>Subscription Active: {activatedPlan?.title || "Plan"}</span>
              </div>

              <div className="onboarding-success__countdown-bar">
                <div className="onboarding-success__countdown-fill" />
              </div>

              <button
                type="button"
                className="auth-page__submit"
                onClick={() => navigate("/")}
              >
                <span>Go to Dashboard Now ({countdown}s)</span>
                <LuArrowRight />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
