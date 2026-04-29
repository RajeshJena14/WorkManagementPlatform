import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, clearError } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

// 1. Base Login Schema
const loginSchema = yup.object().shape({
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

// 2. Expanded Signup Schema (Inherits Login Schema)
const signupSchema = loginSchema.shape({
    name: yup.string().required('Full name is required').min(2, 'Name is too short'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
    countryCode: yup.string().required('Required'),
    phone: yup.string()
        .matches(/^[0-9]{7,15}$/, 'Invalid phone number (digits only)')
        .required('Phone number is required'),
    role: yup.string()
        .oneOf(['Admin', 'Manager', 'Employee'], 'Please select a valid role')
        .required('Role selection is required'),
});

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    // Dynamically switch validation schemas
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(isLoginMode ? loginSchema : signupSchema),
        defaultValues: {
            countryCode: '+91' // Setting +91 (India) as the default based on standard use cases
        }
    });

    const toggleMode = () => {
        setIsLoginMode((prev) => !prev);
        reset();
        dispatch(clearError()); // Clear any lingering errors on toggle
    };

    const onSubmit = (data) => {
        if (isLoginMode) {
            // Dispatch real Login Thunk
            dispatch(loginUser({ email: data.email, password: data.password }));
        } else {
            // Dispatch real Register Thunk
            dispatch(registerUser({
                name: data.name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                countryCode: data.countryCode,
                role: data.role
            }));
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <header className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    WORK<span className="text-blue-600">SYNC</span>
                </h1>
                <h2 className="mt-4 text-xl font-medium text-gray-700">
                    {isLoginMode ? 'Sign in to your account' : 'Create a new account'}
                </h2>
            </header>

            <section className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>

                        {/* FULL NAME - Signup Only */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <div className="mt-1">
                                    <input id="name" {...register('name')} type="text" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* EMAIL - Both */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1">
                                <input id="email" {...register('email')} type="email" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                            </div>
                        </div>

                        {/* PHONE NUMBER - Signup Only */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <div className="mt-1 flex gap-2">
                                    <div className="w-1/3 relative">
                                        <select id="countryCode" {...register('countryCode')} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white">
                                            <option value="+1">+1 (US/CA)</option>
                                            <option value="+44">+44 (UK)</option>
                                            <option value="+91">+91 (IN)</option>
                                            <option value="+61">+61 (AU)</option>
                                            <option value="+81">+81 (JP)</option>
                                        </select>
                                    </div>
                                    <div className="w-2/3 relative">
                                        <input id="phone" {...register('phone')} type="tel" placeholder="1234567890" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                </div>
                                {(errors.countryCode || errors.phone) && (
                                    <p className="mt-1 text-xs text-red-600">{errors.phone?.message || 'Valid phone required'}</p>
                                )}
                            </div>
                        )}

                        {/* ROLE SELECTION - Signup Only */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Account Role</label>
                                <div className="mt-1">
                                    <select id="role" {...register('role')} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white">
                                        <option value="">Select a role...</option>
                                        <option value="Employee">Employee</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                    {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* PASSWORD - Both */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1">
                                <input id="password" {...register('password')} type="password" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                            </div>
                        </div>

                        {/* CONFIRM PASSWORD - Signup Only */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <div className="mt-1">
                                    <input id="confirmPassword" {...register('confirmPassword')} type="password" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                            >
                                {isLoading ? 'Processing...' : (isLoginMode ? 'Sign in' : 'Create Account')}
                            </button>
                        </div>
                    </form>

                    {/* MODE TOGGLE */}
                    <div className="mt-6 text-center border-t border-gray-100 pt-6">
                        <p className="text-sm text-gray-600">
                            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="font-medium text-blue-600 hover:text-blue-500 transition-colors focus:outline-none"
                            >
                                {isLoginMode ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>

                </div>
            </section>
        </main>
    );
};

export default Login;