import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface ProfileForm {
  firstName: string;
  lastName: string;
  timezone: string;
  currency: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getMe(),
  });

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      timezone: user?.profile?.timezone || 'UTC',
      currency: user?.profile?.currency || 'USD',
    },
  });

  const passwordForm = useForm<PasswordForm>();

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateMe(data),
    onSuccess: (response) => {
      updateUser(response.data.data);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to change password');
    },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfile.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    changePassword.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {(['profile', 'password', 'preferences'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="max-w-xl space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    {...profileForm.register('firstName')}
                    type="text"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    {...profileForm.register('lastName')}
                    type="text"
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input bg-gray-50"
                />
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="max-w-xl space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  {...passwordForm.register('currentPassword', { required: true })}
                  type="password"
                  className="input"
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  {...passwordForm.register('newPassword', { required: true })}
                  type="password"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  {...passwordForm.register('confirmPassword', { required: true })}
                  type="password"
                  className="input"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {changePassword.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="max-w-xl space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Timezone</label>
                <select {...profileForm.register('timezone')} className="input">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select {...profileForm.register('currency')} className="input">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      )}
    </div>
  );
};
