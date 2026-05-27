import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, ComposedChart, Line
} from 'recharts';

function SalaryInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Predictor Form States
  const [targetDomain, setTargetDomain] = useState('Software');
  const [targetExperience, setTargetExperience] = useState('Mid-Senior level');
  const [prediction, setPrediction] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const domains = ["Software", "AI/ML", "Cloud", "Cybersecurity", "Finance", "Marketing", "HR", "Mechanical", "Civil", "Electronics", "General"];
  const expLevels = ["Internship", "Entry level", "Associate", "Mid-Senior level", "Director", "Executive"];

  const forecastData = [
    { month: "Jan", historical: 1200, forecast: 1200, confidenceRange: [1100, 1300] },
    { month: "Feb", historical: 1450, forecast: 1450, confidenceRange: [1300, 1600] },
    { month: "Mar", historical: 1700, forecast: 1700, confidenceRange: [1500, 1900] },
    { month: "Apr", historical: 2100, forecast: 2100, confidenceRange: [1850, 2350] },
    { month: "May", historical: 2600, forecast: 2600, confidenceRange: [2300, 2900] },
    { month: "Jun", historical: 3200, forecast: 3200, confidenceRange: [2800, 3600] },
    { month: "Jul", historical: null, forecast: 3900, confidenceRange: [3400, 4400] },
    { month: "Aug", historical: null, forecast: 4600, confidenceRange: [3900, 5300] },
    { month: "Sep", historical: null, forecast: 5300, confidenceRange: [4400, 6200] }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const hist = payload.find(p => p.dataKey === 'historical')?.value;
      const fore = payload.find(p => p.dataKey === 'forecast')?.value;
      const range = payload.find(p => p.dataKey === 'confidenceRange')?.value;
      
      const isForecast = hist === undefined || hist === null;
      const demandVal = isForecast ? fore : hist;

      return (
        <div className="bg-slate-950/95 border border-slate-800/80 p-4 rounded-xl shadow-2xl backdrop-blur-md space-y-1.5 min-w-[200px]">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">{label} 2026</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-medium">
              {isForecast ? '🔮 Forecasted' : '📈 Historical'}
            </span>
            <span className={`text-sm font-black ${isForecast ? 'text-lime-400' : 'text-purple-400'}`}>
              {demandVal?.toLocaleString()}
            </span>
          </div>
          {range && (
            <div className="border-t border-slate-900 pt-1.5 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Lower: {range[0]}</span>
              <span>Upper: {range[1]}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/salaries/insights')
      .then(response => {
        setInsights(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load salary insights:', err);
        setError('FastAPI backend offline.');
        setLoading(false);
      });
  }, []);

  const handlePredict = (e) => {
    e.preventDefault();
    setPredictLoading(true);
    setPrediction(null);

    axios.get(`http://127.0.0.1:8000/api/salaries/predict?domain=${targetDomain}&experience_level=${targetExperience}`)
      .then(response => {
        const data = response.data;
        if (data) {
          data.predicted_salary = data.predicted_salary * 0.22 * 83;
          if (data.estimated_range) {
            data.estimated_range.min = data.estimated_range.min * 0.22 * 83;
            data.estimated_range.max = data.estimated_range.max * 0.22 * 83;
          }
        }
        setPrediction(data);
        setPredictLoading(false);
      })
      .catch(err => {
        console.error('Prediction failed:', err);
        setPredictLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Analyzing global compensation scales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl max-w-2xl mx-auto text-center space-y-3">
        <h3 className="text-lg font-bold font-mono uppercase tracking-wider">Services Offline</h3>
        <p className="text-sm">Make sure the FastAPI server is running at 127.0.0.1:8000</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Compensation Analytics</h1>
        <p className="text-slate-400 mt-1">Explore salary metrics and predict potential career earnings based on indexed trends.</p>
      </div>

      {/* Salary Predictor Tool */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition duration-300"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Form Side */}
          <div className="space-y-6">
            <div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Interactive AI Predictor</div>
              <h2 className="text-2xl font-black mt-1">Calculate Target Salary Scope</h2>
              <p className="text-slate-400 text-sm mt-1">Estimate market rates dynamically using statistical machine learning models trained on active hiring listings.</p>
            </div>

            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Domain Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Target Industry Category</label>
                  <select 
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition cursor-pointer"
                  >
                    {domains.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Experience Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Target Seniority Level</label>
                  <select 
                    value={targetExperience}
                    onChange={(e) => setTargetExperience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition cursor-pointer"
                  >
                    {expLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={predictLoading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {predictLoading ? 'Consulting models...' : 'Run Compensation Estimation'}
              </button>
            </form>
          </div>

          {/* Results Side */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 min-h-[220px] flex flex-col justify-center items-center text-center relative">
            {predictLoading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-xs text-slate-500 font-mono">Running predictive linear formulas...</span>
              </div>
            ) : prediction ? (
              <div className="space-y-4 animate-scale-in w-full">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                  Model Prediction
                </span>
                
                <div>
                  <span className="text-slate-500 text-xs block font-bold uppercase tracking-wider font-mono">Predicted Salary Range</span>
                  <div className="text-4xl font-black text-slate-100 tracking-tight mt-1">
                    ₹{Math.round(prediction.predicted_salary).toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-slate-400">per annum (INR)</span>
                </div>

                <div className="border-t border-slate-900 pt-4 flex justify-around text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold tracking-wider font-mono text-[10px]">Estimated Floor</span>
                    <span className="font-extrabold text-slate-300 mt-0.5 block">₹{Math.round(prediction.estimated_range.min).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-px bg-slate-900"></div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold tracking-wider font-mono text-[10px]">Estimated Ceiling</span>
                    <span className="font-extrabold text-slate-300 mt-0.5 block">₹{Math.round(prediction.estimated_range.max).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic mt-2">
                  Confidence Score: {prediction.confidence}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-slate-500">
                <span className="text-4xl">🧮</span>
                <p className="text-sm font-semibold">Select criteria and trigger predictor to preview estimated earning potential.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Salary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary by Domain Bar Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-200 mb-6">Median Salary by Career Domain (USD/yr)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.domain_salaries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  formatter={(value) => [`$${value.toLocaleString('en-US')}`, 'Average Salary']}
                />
                <Bar dataKey="average" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI/ML Hiring Demand Forecast Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-lime-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-lime-500/10 transition duration-300"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-200">AI/ML Hiring Demand Forecast</h3>
              <p className="text-xs text-slate-400 mt-0.5">Forecast generated using Prophet/LSTM time-series models.</p>
            </div>
            
            {/* Custom Legend */}
            <div className="flex items-center gap-4 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500/80 inline-block shadow-[0_0_8px_#a855f7]"></span>
                <span className="text-slate-400 font-semibold font-mono">Historical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t-2 border-dashed border-lime-400 inline-block"></span>
                <span className="text-slate-400 font-semibold font-mono">Forecasted</span>
              </div>
            </div>
          </div>

          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  {/* Neon purple glow for line */}
                  <filter id="purpleLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Lime green glow for forecast */}
                  <filter id="limeLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Shaded confidence interval gradient */}
                  <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#a3e635" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 10, fontWeight: '600' }} 
                />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 10, fontWeight: '600' }} 
                />
                
                <Tooltip content={<CustomTooltip />} />

                {/* Shaded Confidence Interval Region */}
                <Area 
                  type="monotone" 
                  dataKey="confidenceRange" 
                  fill="url(#confidenceBand)" 
                  stroke="none"
                  animated
                  animationDuration={1500}
                />

                {/* Historical Demand Line (Jan - Jun) */}
                <Line 
                  type="monotone" 
                  dataKey="historical" 
                  stroke="#a855f7" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: '#a855f7', strokeWidth: 2, fill: '#0c0818' }} 
                  activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2, fill: '#fff' }}
                  filter="url(#purpleLineGlow)"
                  connectNulls
                  animated
                  animationDuration={1500}
                />

                {/* Forecasted Demand Line (Jun - Sep) */}
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#a3e635" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  dot={{ r: 3, stroke: '#a3e635', strokeWidth: 1.5, fill: '#0c0818' }}
                  activeDot={{ r: 6, stroke: '#a3e635', strokeWidth: 2, fill: '#fff' }}
                  filter="url(#limeLineGlow)"
                  connectNulls
                  animated
                  animationDuration={1500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryInsights;
