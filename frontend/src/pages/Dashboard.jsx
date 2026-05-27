import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/analytics')
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch analytics:', err);
        setError('Could not connect to FastAPI server. Make sure the backend is running.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Crunching job market analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl max-w-2xl mx-auto text-center space-y-3">
        <h3 className="text-lg font-bold">Connection Failed</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition"
        >
          Try Reconnecting
        </button>
      </div>
    );
  }

  const COLORS = ['#a855f7', '#84cc16', '#c084fc', '#a3e635', '#7c3aed', '#bef264', '#9333ea', '#65a30d', '#d8b4fe', '#4c1d95'];

  // Format Pie chart data
  const pieData = [
    { name: 'Remote Allowed', value: data.remote_ratio.remote },
    { name: 'Onsite / Hybrid', value: data.remote_ratio.onsite }
  ];
  const PIE_COLORS = ['#a3e635', '#a855f7'];

  // Metrics helper calculations
  const remotePercentage = data.total_jobs > 0 
    ? ((data.remote_ratio.remote / data.total_jobs) * 100).toFixed(1) 
    : 0;

  const topDomain = data.domain_distribution[0] 
    ? data.domain_distribution[0].domain 
    : 'None';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Intro */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Market Intelligence Overview</h1>
        <p className="text-slate-400 mt-1">Real-time indicators across key career sectors and hiring categories.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Jobs */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all duration-300"></div>
          <div className="text-sm text-slate-500 font-medium font-mono uppercase tracking-wider">Indexed Postings</div>
          <div className="text-4xl font-extrabold mt-2 tracking-tight">{data.total_jobs.toLocaleString()}</div>
          <div className="text-xs text-indigo-400 font-semibold mt-1 flex items-center gap-1">
            <span>📈</span> SQLite Database Live
          </div>
        </div>

        {/* Remote Ratio */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="text-sm text-slate-500 font-medium font-mono uppercase tracking-wider">Remote Allowed</div>
          <div className="text-4xl font-extrabold mt-2 tracking-tight">{remotePercentage}%</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <span>🌍</span> {data.remote_ratio.remote.toLocaleString()} openings
          </div>
        </div>

        {/* Top Industry Domain */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
          <div className="text-sm text-slate-500 font-medium font-mono uppercase tracking-wider">Top Domain</div>
          <div className="text-2xl font-black mt-2 truncate tracking-tight">{topDomain}</div>
          <div className="text-xs text-purple-400 font-semibold mt-1 flex items-center gap-1">
            <span>🔥</span> {data.domain_distribution[0]?.count.toLocaleString()} active openings
          </div>
        </div>

        {/* Top Hiring Hub */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-300"></div>
          <div className="text-sm text-slate-500 font-medium font-mono uppercase tracking-wider">Hiring Hotspot</div>
          <div className="text-2xl font-black mt-2 truncate tracking-tight">
            {data.top_locations && data.top_locations[0] ? data.top_locations[0].location.split(',')[0] : 'None'}
          </div>
          <div className="text-xs text-amber-400 font-semibold mt-1 flex items-center gap-1">
            <span>📍</span> {data.top_locations && data.top_locations[0] ? data.top_locations[0].count.toLocaleString() : 0} indexed positions
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-6">Openings by Career Domain</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.domain_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="domain" 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 10 }} 
                  angle={-35} 
                  textAnchor="end" 
                  height={50}
                />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.domain_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Remote Ratio Pie Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Work Configuration</h3>
            <p className="text-xs text-slate-500">Distribution of onsite/hybrid vs remote roles.</p>
          </div>
          <div className="h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }}></span>
                <span className="text-xs text-slate-400 font-semibold">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* bottom list section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experience Distribution */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Job Distribution by Experience</h3>
          <div className="space-y-4">
            {data.experience_distribution.map((item, idx) => {
              const percentage = data.total_jobs > 0 
                ? ((item.count / data.total_jobs) * 100).toFixed(1) 
                : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-300">{item.experience_level}</span>
                    <span className="text-slate-400 font-mono">{item.count.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Locations list */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Hiring Hub Locations</h3>
          <div className="divide-y divide-slate-800">
            {data.top_locations && data.top_locations.length > 0 ? (
              data.top_locations.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-indigo-400">📍</span>
                    <span className="font-medium text-slate-300">{item.location}</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-mono">
                    {item.count} Openings
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs py-4 text-center">No locations indexed yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
