import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useTheme } from '../context/ThemeContext';
import { io } from 'socket.io-client';

const Settings = () => {
    const { user } = useSelector((state) => state.auth);
    const { isDarkMode, toggleTheme } = useTheme();

    // We use react-hook-form to cleanly manage the profile and password states
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });

    const onSubmit = (data) => {
        // In production, this would dispatch an async thunk to your Node.js backend
        // to update the user record and securely hash the new password if provided.

        if (data.newPassword && data.newPassword !== data.confirmPassword) {
            toast.error('New passwords do not match!');
            return;
        }

        console.log('Saving profile payload:', data);
        toast.success('Settings updated successfully!');

        // Connect briefly to trigger the self-notification
        const socket = io('https://workmanagementplatform-production.up.railway.app');
        socket.emit('self_notification', {
            userId: user.id,
            title: 'Account Settings Updated',
            message: 'Your personal preferences and profile details have been securely saved.'
        });

        // Clean up connection after sending
        setTimeout(() => socket.disconnect(), 1000);
    };

    // Reusable styles for the enterprise slate theme
    const inputClasses = "appearance-none mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm transition-colors duration-200";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300";
    const legendClasses = "text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 w-full";

    return (
        <section className="max-w-3xl bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your profile details and preferences.</p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* 1. Profile Information */}
                <fieldset>
                    <legend className={legendClasses}>Personal Information</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="name" className={labelClasses}>Full Name</label>
                            <input id="name" {...register('name')} type="text" className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="email" className={labelClasses}>Email Address</label>
                            <input id="email" {...register('email')} type="email" className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="phone" className={labelClasses}>Phone Number</label>
                            <input id="phone" {...register('phone')} type="tel" className={inputClasses} placeholder="+1 234 567 8900" />
                        </div>
                    </div>
                </fieldset>

                {/* 2. Security / Change Password */}
                <fieldset>
                    <legend className={legendClasses}>Security</legend>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className={labelClasses}>Current Password</label>
                            <input id="currentPassword" {...register('currentPassword')} type="password" placeholder="Leave blank to keep current" className={inputClasses} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="newPassword" className={labelClasses}>New Password</label>
                                <input id="newPassword" {...register('newPassword')} type="password" placeholder="New password" className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className={labelClasses}>Confirm New Password</label>
                                <input id="confirmPassword" {...register('confirmPassword')} type="password" placeholder="Confirm new password" className={inputClasses} />
                            </div>
                        </div>
                    </div>
                </fieldset>

                {/* 3. System Preferences */}
                <fieldset>
                    <legend className={legendClasses}>Preferences</legend>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Dark Mode</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Toggle the system color theme</span>
                        </div>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className={`${isDarkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
                            role="switch"
                            aria-checked={isDarkMode}
                            aria-label="Toggle dark mode"
                        >
                            <span className={`${isDarkMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                        </button>
                    </div>
                </fieldset>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
                    <button
                        type="reset"
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </section>
    );
};

export default Settings;