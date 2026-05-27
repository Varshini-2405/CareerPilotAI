import React, { useState } from 'react';
import apiClient from '../services/api';

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [targetJob, setTargetJob] = useState('Software Engineer');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a resume file first.");
      return;
    }
    
    // File size validation (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError("The uploaded file exceeds the 5MB size limit. Please select a smaller document.");
      return;
    }

    // Extension validation
    const allowedExtensions = /(\.pdf|\.txt|\.doc|\.docx)$/i;
    if (!allowedExtensions.exec(file.name)) {
      setError("Invalid file format. Only PDF, TXT, or Word Documents (.doc, .docx) are supported.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_job', targetJob);

    apiClient.post('/api/ml/resume-analysis', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(response => {
        setAnalysis(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Resume analysis failed:', err);
        const errMsg = err.response?.data?.detail || 'Failed to analyze resume. Make sure backend FastAPI server is running.';
        setError(errMsg);
        setLoading(false);
      });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">AI Resume Coach</h1>
        <p className="text-slate-400 mt-1">Audit your resume compatibility against target careers and extract immediate skill gaps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 h-fit backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-4">CV Analysis Profile</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Job Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Role Title</label>
              <input 
                type="text" 
                placeholder="e.g. Data Scientist, Cloud Architect" 
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              />
            </div>

            {/* File Upload Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Upload Resume (PDF, TXT, DOCX)</label>
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center cursor-pointer transition relative bg-slate-950/20">
                <input 
                  type="file" 
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-1.5 text-slate-400">
                  <span className="text-2xl block">📁</span>
                  <span className="text-xs font-semibold block">
                    {file ? file.name : 'Select or drag CV file here'}
                  </span>
                  <span className="text-[10px] text-slate-500">Max size 5MB</span>
                </div>
              </div>
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
              {loading ? 'Analyzing syntax & keywords...' : 'Start Audit'}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm min-h-[300px] flex flex-col justify-center">
          {loading ? (
            <div className="space-y-3 text-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 text-sm font-semibold">Extracting technical terms using spaCy models...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6 animate-scale-in">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
                {/* Visual score circle */}
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-slate-950 border-4 border-slate-850 shadow-inner">
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-500 border-b-indigo-500 border-l-slate-800 animate-pulse"></div>
                  <span className="text-2xl font-black">{analysis.score}%</span>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Compatibility Audit Results</span>
                  <h3 className="text-xl font-bold">Target fit for: {analysis.target_job}</h3>
                  <p className="text-xs text-slate-400 font-semibold">Processed document: {analysis.filename}</p>
                </div>
              </div>

              {/* Skills breakdown grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Extracted/Matched Skills */}
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">Matched Capabilities ({analysis.matched_skills.length})</h4>
                  {analysis.matched_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.matched_skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/10">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No overlapping skills matching target profile found.</p>
                  )}
                </div>

                {/* Missing Skills (Skill Gap) */}
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-400">Target Skill Gap ({analysis.missing_skills.length})</h4>
                  {analysis.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missing_skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 text-xs font-mono border border-rose-500/10">
                          ⚠ {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">All target requirements are satisfied!</p>
                  )}
                </div>
              </div>

              {/* Actionable recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">Career Advisor Action Items</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs text-slate-300 items-start">
                      <span className="text-indigo-400">⚡</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 space-y-2">
              <span className="text-4xl">🤖</span>
              <p className="text-sm font-semibold">Upload your CV to initiate skills match evaluation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
