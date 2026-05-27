import React, { useState } from 'react';
import apiClient from '../services/api';

function CareerPlanner() {
  const [skills, setSkills] = useState('Python, SQL, HTML');
  const [interest, setInterest] = useState('AI/ML');
  const [experienceYears, setExperienceYears] = useState(1);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const interests = ["Software", "AI/ML", "Cloud", "Cybersecurity", "Finance", "Marketing", "HR", "Mechanical", "Civil", "Electronics"];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendation(null);

    const formData = new FormData();
    formData.append('skills', skills);
    formData.append('interest', interest);
    formData.append('experience_years', experienceYears);

    apiClient.post('/api/ml/career-recommendation', formData)
      .then(response => {
        setRecommendation(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Career recommendation error:', err);
        const errMsg = err.response?.data?.detail || 'Failed to fetch career recommendations. Make sure FastAPI server is running.';
        setError(errMsg);
        setLoading(false);
      });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">AI Career Pathway Planner</h1>
        <p className="text-slate-400 mt-1">Plan your milestones, suggest target certifications, and outline domain projects to build a career.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Planner Inputs Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 h-fit backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-4">Milestone Criteria</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Skills CSV Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Current Competencies</label>
              <textarea 
                rows="3"
                placeholder="List your skills separated by commas (e.g. Python, Git, SQL)" 
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition resize-none"
              />
            </div>

            {/* Target Area selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Industry Sector</label>
              <select 
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition cursor-pointer"
              >
                {interests.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Experience level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Current Industry Experience (years)</label>
              <input 
                type="number" 
                min="0"
                max="40"
                step="0.5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              />
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/10 p-3 rounded-lg font-semibold">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? 'Synthesizing roadmap parameters...' : 'Generate Roadmap'}
            </button>
          </form>
        </div>

        {/* Pathway Visual Output Card */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm min-h-[350px] flex flex-col justify-center">
          {loading ? (
            <div className="space-y-3 text-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 text-sm font-semibold">Consulting career catalog profiles...</p>
            </div>
          ) : recommendation ? (
            <div className="space-y-6 animate-scale-in">
              {/* Output Header */}
              <div className="pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Custom Career Pathway</span>
                  <h3 className="text-xl font-bold">Domain Roadmap: {recommendation.target_interest}</h3>
                </div>
                {/* Market Demand Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Market Demand:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    recommendation.market_demand === 'High' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {recommendation.market_demand}
                  </span>
                </div>
              </div>
              
              {/* Market Insights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Estimated Target Salary</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-400">
                      ₹{recommendation.estimated_target_salary ? Math.round(recommendation.estimated_target_salary * 83).toLocaleString('en-IN') : 0}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ year</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Based on indexed regional dataset averages scaled for experience level.</p>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Identified Skill Gap</span>
                  {recommendation.missing_skills && recommendation.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recommendation.missing_skills.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 text-xs font-mono border border-rose-500/10">
                          ⚠ {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-400 font-medium">✓ You possess the primary core skills for this domain!</p>
                  )}
                  <p className="text-[10px] text-slate-500">Acquire these key tools to maximize hireability in {recommendation.target_interest}.</p>
                </div>
              </div>

              {/* Recommended Roles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">Recommended Roles Target</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendation.recommended_roles.map((role, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center gap-3">
                      <span className="text-lg">🎯</span>
                      <span className="font-semibold text-slate-200 text-sm">{role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations Timeline/Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Certifications Card */}
                <div className="space-y-3 p-5 bg-slate-950/30 rounded-xl border border-slate-850">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-400">Credentials & Certifications</h4>
                  <ul className="space-y-3">
                    {recommendation.certifications.map((cert, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs text-slate-300 items-start">
                        <span className="text-purple-400 text-sm">🥇</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Projects Card */}
                <div className="space-y-3 p-5 bg-slate-950/30 rounded-xl border border-slate-850">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400">Suggested Competency Projects</h4>
                  <ul className="space-y-3">
                    {recommendation.recommended_projects.map((proj, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs text-slate-300 items-start">
                        <span className="text-amber-400 text-sm">🛠️</span>
                        <span>{proj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 space-y-2">
              <span className="text-4xl">🗺️</span>
              <p className="text-sm font-semibold">Enter your experience metrics to map your custom career roadmap.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CareerPlanner;
