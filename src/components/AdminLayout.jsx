import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Film, Tag, Menu, X, LogOut, Bell, Settings, Star, BarChart3 } from 'lucide-react';
import { logout } from '../services/api';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { path: '/admin/users', icon: Users, label: 'Quản lý User', gradient: 'from-purple-500 to-pink-500' },
    { path: '/admin/movies', icon: Film, label: 'Quản lý Phim', gradient: 'from-emerald-500 to-teal-500' },
    { path: '/admin/categories', icon: Tag, label: 'Thể loại & Diễn viên', gradient: 'from-amber-500 to-orange-500' },
    { path: '/admin/ratings', icon: Star, label: 'Quản lý Đánh giá', gradient: 'from-yellow-500 to-amber-500' },
    { path: '/admin/reports', icon: BarChart3, label: 'Thống kê & Báo cáo', gradient: 'from-red-500 to-pink-500' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        return JSON.parse(userStr);
      }
      return {
        name: 'Admin User',
        email: 'admin@movieapp.com'
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {
        name: 'Admin User',
        email: 'admin@movieapp.com'
      };
    }
  };

  const user = getUserInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Glass Sidebar */}
      <aside className={`fixed top-0 left-0 h-full backdrop-blur-2xl bg-slate-900/40 border-r border-white/10 text-white transition-all duration-300 z-50 shadow-2xl ${
        sidebarOpen ? 'w-72' : 'w-20'
      }`}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col items-start justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  MovieApp
                </h1>
                <div>
                  <p className="font-semibold text-xs text-white">{user.name || 'Admin User'}</p>
                  <p className="text-[10px] text-purple-300">{user.email || 'admin@movieapp.com'}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-lg border border-white/10 hover:border-white/20"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`${sidebarOpen ? '' : 'flex flex-col items-center justify-center'} p-3 space-y-2`}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 overflow-hidden ${
                  isActive 
                    ? 'bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg scale-105' 
                    : 'hover:bg-white/10 backdrop-blur-lg border border-transparent hover:border-white/20 hover:scale-102'
                }`}
              >
                {/* Active gradient background with animation */}
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-20 animate-pulse`}></div>
                )}

                <div className={`relative z-10 p-2 rounded-xl ${
                  isActive 
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                    : 'bg-white/10 group-hover:bg-white/20'
                } transition-all duration-300`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                </div>

                {sidebarOpen && (
                  <span className={`relative z-10 font-semibold transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-purple-200 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-0 right-0 p-3">
          {sidebarOpen ? (
            <button
              onClick={handleLogout}
              className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 backdrop-blur-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 hover:scale-105"
            >
              <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <span className="font-semibold text-red-300 group-hover:text-red-200 transition-colors">Đăng xuất</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full p-3 rounded-xl transition-all duration-300 backdrop-blur-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 hover:scale-110"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content with Page Transitions */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Page Content with Fade Animation */}
        <main className="animate-fadeInUp">
          <Outlet />
        </main>
      </div>

      {/* Add custom animations via style tag */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.4s ease-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        /* Smooth page transition */
        main > * {
          animation: fadeInUp 0.5s ease-out;
        }

        /* Stagger animation for cards/items */
        .stagger-item {
          animation: fadeInUp 0.5s ease-out;
          animation-fill-mode: both;
        }

        .stagger-item:nth-child(1) { animation-delay: 0.1s; }
        .stagger-item:nth-child(2) { animation-delay: 0.2s; }
        .stagger-item:nth-child(3) { animation-delay: 0.3s; }
        .stagger-item:nth-child(4) { animation-delay: 0.4s; }
        .stagger-item:nth-child(5) { animation-delay: 0.5s; }
        .stagger-item:nth-child(6) { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
