import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard Overview';
      case '/wallet':
        return 'My Campus Wallet';
      case '/payments':
        return 'Send Campus Payment';
      case '/transactions':
        return 'Transaction History';
      case '/cashback':
        return 'Cashback & Rewards';
      case '/reports':
        return 'Financial Reports & Reconciliation';
      case '/profile':
        return 'Student Profile';
      default:
        return 'FinPay Campus Wallet';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <button
          title="Notifications"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>

        <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

        {/* Profile Link */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.full_name || 'Student'}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">{user?.student_id}</p>
          </div>
        </div>

        {/* Logout Quick Button */}
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          title="Logout"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
