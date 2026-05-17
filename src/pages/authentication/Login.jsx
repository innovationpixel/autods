import React, { useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loadingToggleAction, loginAction } from '../../store/actions/AuthActions';

import logo from '../../assets/images/logo-full.png';
import logo2 from '../../assets/images/logo-full-white.png';
import pic1 from '../../assets/images/pic1.svg';

function Login(props) {
    const [openEyes, setOpenEyes] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: '', password: '' });

    const dispatch = useDispatch();
    const navigate = useNavigate();

    function onLogin(e) {
        e.preventDefault();
        const errorObj = { email: '', password: '' };
        let hasError = false;

        if (!email) { errorObj.email = 'Email is required'; hasError = true; }
        if (!password) { errorObj.password = 'Password is required'; hasError = true; }

        setErrors(errorObj);
        if (hasError) return;

        dispatch(loadingToggleAction(true));
        dispatch(loginAction(email, password, navigate));
    }

    return (
        <div className="authincation d-flex flex-column flex-lg-row flex-column-fluid">
            <div className="login-aside text-center d-none d-sm-flex flex-column flex-row-auto">
                <div className="d-flex flex-column-auto flex-column pt-lg-40 pt-15">
                    <div className="text-center mb-4 pt-5">
                        <Link to="/"><img src={logo} className="dark-login" alt="" /></Link>
                        <Link to="/"><img src={logo2} className="light-login" alt="" /></Link>
                    </div>
                    <h3 className="mb-2">Welcome back!</h3>
                    <p>User Experience & Interface Design <br />Strategy SaaS Solutions</p>
                </div>
                <div className="aside-image" style={{ backgroundImage: `url(${pic1})` }}></div>
            </div>
            <div className="container flex-row-fluid d-flex flex-column justify-content-center position-relative overflow-hidden p-7 mx-auto">
                <div className="d-flex justify-content-center h-100 align-items-center">
                    <div className="authincation-content style-2">
                        <div className="row no-gutters">
                            <div className="col-xl-12 tab-content">
                                <div id="sign-in" className="auth-form form-validation">
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
                                    <form onSubmit={onLogin} className="form-validate">
                                        <h3 className="text-center mb-4 text-black">Sign in your account</h3>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                            />
                                            {errors.email && <div className="text-danger fs-12">{errors.email}</div>}
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="mb-1 form-label required">Password</label>
                                            <div className="position-relative">
                                                <input
                                                    type={openEyes ? 'password' : 'text'}
                                                    className="form-control"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Enter your password"
                                                />
                                                {errors.password && <div className="text-danger fs-12">{errors.password}</div>}
                                                <span
                                                    className={`show-pass eye ${openEyes ? '' : 'active'}`}
                                                    onClick={() => setOpenEyes(!openEyes)}
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
                                                {props.showLoading ? 'Signing in...' : 'Sign In'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
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
