import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import apiClient from '../services/api';

function Layout() {
  const [apiStatus, setApiStatus] = useState('checking');
  const location = useLocation();

  useEffect(() => {
    // Poll backend health status
    const checkHealth = () => {
      apiClient.get('/health')
        .then(() => setApiStatus('online'))
        .catch(() => setApiStatus('offline'));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Job Board', path: '/jobs', icon: '🔍' },
    { name: 'Salary Insights', path: '/salaries', icon: '💰' },
    { name: 'Resume Analyzer', path: '/resume', icon: '📄' },
    { name: 'Career Recommendation', path: '/career', icon: '🚀' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 border-r border-slate-800/80 flex flex-col justify-between backdrop-blur-md hidden md:flex">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60 bg-slate-900/10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-md shadow-lg shadow-indigo-500/20">
              ✈️
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CareerPilot <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-400 border-l-4 border-indigo-500'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-6 border-t border-slate-800/60 bg-slate-900/10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-xs text-slate-500 font-mono">v1.0.0 (SQLite)</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Title */}
            <span className="font-black text-md tracking-tight block md:hidden bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CareerPilot AI
            </span>
            <h2 className="text-sm font-semibold text-slate-300 hidden md:block">
              {navItems.find(item => item.path === location.pathname)?.name || 'Platform'}
            </h2>
          </div>

          {/* Connection Status and Controls */}
          <div className="flex items-center gap-4">
            {apiStatus === 'online' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                API Disconnected
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950 relative">
          {/* Ambient Glows */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
