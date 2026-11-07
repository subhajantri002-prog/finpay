import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Hash,
  Phone,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { formatDateTime } from '../utils/formatters';

export const Profile: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const [phone, setPhone] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updatedUser = await authService.updateMe({ phone: phone.trim() });
      updateCurrentUser(updatedUser);
      setSuccessMessage('Phone number updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to update phone number.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center space-x-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0">
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Student ID: <span className="font-mono font-semibold text-slate-700">{user?.student_id}</span>
          </p>
          <div className="mt-2 flex items-center space-x-2">
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Verified Campus Student
            </span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Details Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">Student Account Information</h3>
        <p className="text-xs text-slate-500 mb-6">
          Review your university student profile. Institutional fields (Name, USN, Email, Status) are
          immutable per university wallet guidelines.
        </p>

        <form onSubmit={handleUpdatePhone} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name (Immutable) */}
            <div>
              <label className="flex items-center text-xs font-semibold text-slate-700 mb-1">
                Full Name <Lock className="w-3 h-3 ml-1 text-slate-400" />
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user?.full_name || ''}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Student ID / USN (Immutable) */}
            <div>
              <label className="flex items-center text-xs font-semibold text-slate-700 mb-1">
                Student ID / USN <Lock className="w-3 h-3 ml-1 text-slate-400" />
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user?.student_id || ''}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 font-mono cursor-not-allowed uppercase"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email (Immutable) */}
            <div>
              <label className="flex items-center text-xs font-semibold text-slate-700 mb-1">
                University Email <Lock className="w-3 h-3 ml-1 text-slate-400" />
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Status (Immutable) */}
            <div>
              <label className="flex items-center text-xs font-semibold text-slate-700 mb-1">
                Account Status <Lock className="w-3 h-3 ml-1 text-slate-400" />
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                <input
                  type="text"
                  disabled
                  value={user?.is_active ? 'Active Campus Account' : 'Inactive'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-emerald-700 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Phone (EDITABLE) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-900 mb-1">
              Contact Phone Number (Editable)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSaving}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Used for important transaction alerts and SMS receipts.
            </p>
          </div>

          {/* Member Since info */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Member Since:{' '}
              <strong className="ml-1 text-slate-700">
                {user?.created_at ? formatDateTime(user.created_at) : 'N/A'}
              </strong>
            </span>
          </div>

          {/* Save Button */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:bg-blue-400"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
