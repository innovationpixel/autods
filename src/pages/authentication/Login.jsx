import React, { useEffect, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loadingToggleAction, loginAction, signupAction } from '../../store/actions/AuthActions';
import { getStoredToken } from '../../services/AuthService';

import logo from '../../assets/images/logo-full.png';
import logo2 from '../../assets/images/logo-full-white.png';
import pic1 from '../../assets/images/pic1.svg';

function Login(props) {
    const [tab, setTab] = useState('login');

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [loginErrors, setLoginErrors] = useState({});

    // Register fields
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirm, setRegConfirm] = useState('');
    const [showRegPw, setShowRegPw] = useState(false);
    const [regErrors, setRegErrors] = useState({});

    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (getStoredToken()) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    function onLogin(e) {
        e.preventDefault();
        const errs = {};
        if (!loginEmail)    errs.email    = 'Email is required';
        if (!loginPassword) errs.password = 'Password is required';
        setLoginErrors(errs);
        if (Object.keys(errs).length) return;

        dispatch(loadingToggleAction(true));
        dispatch(loginAction(loginEmail, loginPassword, navigate));
    }

    function onRegister(e) {
        e.preventDefault();
        const errs = {};
        if (!regName)                              errs.name     = 'Name is required';
        if (!regEmail)                             errs.email    = 'Email is required';
        if (!regPassword)                          errs.password = 'Password is required';
        else if (regPassword.length < 8)           errs.password = 'Password must be at least 8 characters';
        if (regPassword !== regConfirm)            errs.confirm  = 'Passwords do not match';
        setRegErrors(errs);
        if (Object.keys(errs).length) return;

        dispatch(signupAction(regName, regEmail, regPassword, regConfirm, navigate));
    }

    return (
        <div className="authincation d-flex flex-column flex-lg-row flex-column-fluid">
            <div className="login-aside text-center d-none d-sm-flex flex-column flex-row-auto">
                <div className="d-flex flex-column-auto flex-column pt-lg-40 pt-15">
                    <div className="text-center mb-4 pt-5">
                        <Link to="/"><img src={logo} className="dark-login" alt="" /></Link>
                        <Link to="/"><img src={logo2} className="light-login" alt="" /></Link>
                    </div>
                    <h3 className="mb-2">{tab === 'login' ? 'Welcome back!' : 'Get started today!'}</h3>
                    <p>Automate your dropshipping business <br />with eBay &amp; AliExpress integration</p>
                </div>
                <div className="aside-image" style={{ backgroundImage: `url(${pic1})` }}></div>
            </div>

            <div className="container flex-row-fluid d-flex flex-column justify-content-center position-relative overflow-hidden p-7 mx-auto">
                <div className="d-flex justify-content-center h-100 align-items-center">
                    <div className="authincation-content style-2">
                        <div className="row no-gutters">
                            <div className="col-xl-12 tab-content">

                                {/* Tab switcher */}
                                <div className="d-flex mb-4" style={{ borderBottom: '2px solid #e5e7eb' }}>
                                    <button
                                        type="button"
                                        style={{
                                            flex: 1, padding: '10px 0', border: 'none', background: 'none',
                                            fontWeight: 600, fontSize: 15, cursor: 'pointer',
                                            borderBottom: tab === 'login' ? '2px solid #6366f1' : '2px solid transparent',
                                            color: tab === 'login' ? '#6366f1' : '#6b7280',
                                        }}
                                        onClick={() => setTab('login')}
                                    >
                                        Sign In
                                    </button>
                                    {/* <button
                                        type="button"
                                        style={{
                                            flex: 1, padding: '10px 0', border: 'none', background: 'none',
                                            fontWeight: 600, fontSize: 15, cursor: 'pointer',
                                            borderBottom: tab === 'register' ? '2px solid #6366f1' : '2px solid transparent',
                                            color: tab === 'register' ? '#6366f1' : '#6b7280',
                                        }}
                                        onClick={() => setTab('register')}
                                    >
                                        Create Account
                                    </button> */}
                                </div>

                                {props.errorMessage && (
                                    <div className="bg-red-300 text-red-900 border border-red-900 p-1 my-2">
                                        {props.errorMessage}
                                    </div>
                                )}
                                {props.successMessage && (
                                    <div className="bg-green-300 text-green-900 border border-green-900 p-1 my-2">
                                        {props.successMessage}
                                    </div>
                                )}

                                {/* ── Login form ─────────────────────────────────── */}
                                {/* {tab === 'login' && (
                                    <form onSubmit={onLogin} className="form-validate">
                                        <h3 className="text-center mb-4 text-black">Sign in to your account</h3>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                            />
                                            {loginErrors.email && <div className="text-danger fs-12">{loginErrors.email}</div>}
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Password</label>
                                            <div className="position-relative">
                                                <input
                                                    type={showLoginPw ? 'text' : 'password'}
                                                    className="form-control"
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    placeholder="Enter your password"
                                                />
                                                {loginErrors.password && <div className="text-danger fs-12">{loginErrors.password}</div>}
                                                <span
                                                    className={`show-pass eye ${showLoginPw ? 'active' : ''}`}
                                                    onClick={() => setShowLoginPw((v) => !v)}
                                                >
                                                    <i className="fa fa-eye-slash" />
                                                    <i className="fa fa-eye" />
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-center form-group mb-3">
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-block"
                                                disabled={props.showLoading}
                                            >
                                                {props.showLoading ? 'Signing in…' : 'Sign In'}
                                            </button>
                                        </div>
                                        <p className="text-center" style={{ fontSize: 13, color: '#6b7280' }}>
                                            Don't have an account?{' '}
                                            <button type="button" style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('register')}>
                                                Create one
                                            </button>
                                        </p>
                                    </form>
                                )} */}

                                <form onSubmit={onLogin} className="form-validate">
                                        <h3 className="text-center mb-4 text-black">Sign in to your account</h3>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                            />
                                            {loginErrors.email && <div className="text-danger fs-12">{loginErrors.email}</div>}
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Password</label>
                                            <div className="position-relative">
                                                <input
                                                    type={showLoginPw ? 'text' : 'password'}
                                                    className="form-control"
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    placeholder="Enter your password"
                                                />
                                                {loginErrors.password && <div className="text-danger fs-12">{loginErrors.password}</div>}
                                                <span
                                                    className={`show-pass eye ${showLoginPw ? 'active' : ''}`}
                                                    onClick={() => setShowLoginPw((v) => !v)}
                                                >
                                                    <i className="fa fa-eye-slash" />
                                                    <i className="fa fa-eye" />
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-center form-group mb-3">
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-block"
                                                disabled={props.showLoading}
                                            >
                                                {props.showLoading ? 'Signing in…' : 'Sign In'}
                                            </button>
                                        </div>
                                        <p className="text-center" style={{ fontSize: 13, color: '#6b7280' }}>
                                            Don't have an account?{' '}
                                            <button type="button" style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('register')}>
                                                Create one
                                            </button>
                                        </p>
                                    </form>

                                {/* ── Register form ──────────────────────────────── */}
                                {/* {tab === 'register' && (
                                    <form onSubmit={onRegister} className="form-validate">
                                        <h3 className="text-center mb-4 text-black">Create your account</h3>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={regName}
                                                onChange={(e) => setRegName(e.target.value)}
                                                placeholder="Enter your full name"
                                            />
                                            {regErrors.name && <div className="text-danger fs-12">{regErrors.name}</div>}
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                            />
                                            {regErrors.email && <div className="text-danger fs-12">{regErrors.email}</div>}
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Password</label>
                                            <div className="position-relative">
                                                <input
                                                    type={showRegPw ? 'text' : 'password'}
                                                    className="form-control"
                                                    value={regPassword}
                                                    onChange={(e) => setRegPassword(e.target.value)}
                                                    placeholder="At least 8 characters"
                                                />
                                                <span
                                                    className={`show-pass eye ${showRegPw ? 'active' : ''}`}
                                                    onClick={() => setShowRegPw((v) => !v)}
                                                >
                                                    <i className="fa fa-eye-slash" />
                                                    <i className="fa fa-eye" />
                                                </span>
                                            </div>
                                            {regErrors.password && <div className="text-danger fs-12">{regErrors.password}</div>}
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Confirm Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={regConfirm}
                                                onChange={(e) => setRegConfirm(e.target.value)}
                                                placeholder="Re-enter your password"
                                            />
                                            {regErrors.confirm && <div className="text-danger fs-12">{regErrors.confirm}</div>}
                                        </div>
                                        <div className="text-center form-group mb-3">
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-block"
                                                disabled={props.showLoading}
                                            >
                                                {props.showLoading ? 'Creating account…' : 'Create Account'}
                                            </button>
                                        </div>
                                        <p className="text-center" style={{ fontSize: 13, color: '#6b7280' }}>
                                            Already have an account?{' '}
                                            <button type="button" style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('login')}>
                                                Sign in
                                            </button>
                                        </p>
                                    </form>
                                )} */}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const mapStateToProps = (state) => ({
    errorMessage: state.auth.errorMessage,
    successMessage: state.auth.successMessage,
    showLoading: state.auth.showLoading,
});

export default connect(mapStateToProps)(Login);
