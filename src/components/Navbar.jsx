import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-30">
      <Link to="/" className="flex items-center gap-2 font-bold text-slate-800 text-lg">
        <ShieldCheck className="w-6 h-6 text-indigo-600" />
        <span>SecureExam</span>
      </Link>
      <div className="flex items-center gap-4">
        {profile && (
          <>
            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {profile.full_name} ({profile.role})
            </span>
            {profile.role === 'admin' && (
              <Link to="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}