import React, { useState, useEffect } from 'react';
import axios from 'axios';

const isIndianLocation = (location) => {
  if (!location) return true;
  const locLower = location.toLowerCase();
  const indianKeywords = [
    'india', 'bengaluru', 'bangalore', 'karnataka', 'mumbai', 'maharashtra', 
    'hyderabad', 'telangana', 'pune', 'chennai', 'tamil nadu', 'delhi', 
    'gurgaon', 'haryana', 'noida', 'uttar pradesh', 'kolkata', 'west bengal', 
    'ahmedabad', 'gujarat'
  ];
  return indianKeywords.some(keyword => locLower.includes(keyword));
};

const formatSalary = (salaryUSD, location) => {
  if (!salaryUSD) return 'Not Specified';
  if (isIndianLocation(location)) {
    // Scale USD salaries to match Indian market rates (approx. 0.22x nominal scale)
    const salaryINR = salaryUSD * 0.22 * 83;
    return `₹${Math.round(salaryINR).toLocaleString('en-IN')} / yr`;
  } else {
    return `$${Math.round(salaryUSD).toLocaleString('en-US')} / yr`;
  }
};

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [remote, setRemote] = useState('');
  const [location, setLocation] = useState('');

  // Selected Job (for details modal)
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const domains = ["Software", "AI/ML", "Cloud", "Cybersecurity", "Finance", "Marketing", "HR", "Mechanical", "Civil", "Electronics", "General"];
  const expLevels = ["Internship", "Entry level", "Associate", "Mid-Senior level", "Director", "Executive"];

  const fetchJobs = () => {
    setLoading(true);
    setError(null);
    let url = `http://127.0.0.1:8000/api/jobs?page=${page}&limit=8`;
    
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (domain) url += `&domain=${encodeURIComponent(domain)}`;
    if (experienceLevel) url += `&experience_level=${encodeURIComponent(experienceLevel)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (remote !== '') url += `&remote=${remote === 'true'}`;

    axios.get(url)
      .then(response => {
        setJobs(response.data.jobs);
        setTotalCount(response.data.total);
        setTotalPages(response.data.total_pages);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching jobs:', err);
        setError('Failed to connect to FastAPI server. Make sure the backend is running at http://127.0.0.1:8000.');
        setLoading(false);
      });
  };

  // Fetch jobs on mount, and whenever filters/page changes
  useEffect(() => {
    fetchJobs();
  }, [page, domain, experienceLevel, remote]);

  // Reset page when typing filters, but let user click "Search" manually
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  // Fetch job details when modal opens
  useEffect(() => {
    if (selectedJobId) {
      setDetailsLoading(true);
      axios.get(`http://127.0.0.1:8000/api/jobs/${selectedJobId}`)
        .then(response => {
          setSelectedJob(response.data);
          setDetailsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching job details:', error);
          setDetailsLoading(false);
        });
    } else {
      setSelectedJob(null);
    }
  }, [selectedJobId]);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Active Opportunities</h1>
        <p className="text-slate-400 mt-1">Search, filter, and drill into indexed listings with verified salary attributes.</p>
      </div>

      {/* Filter and Search Bar Card */}
      <form onSubmit={handleSearchSubmit} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <input 
              type="text" 
              placeholder="Search by titles, keywords, skills, or companies..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
            />
          </div>
          {/* Location Input */}
          <div>
            <input 
              type="text" 
              placeholder="Location (e.g. San Francisco)" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Dropdown Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Domain Dropdown */}
            <select 
              value={domain} 
              onChange={(e) => { setDomain(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="">All Domains</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Experience Dropdown */}
            <select 
              value={experienceLevel} 
              onChange={(e) => { setExperienceLevel(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="">All Experience Levels</option>
              {expLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>

            {/* Remote Dropdown */}
            <select 
              value={remote} 
              onChange={(e) => { setRemote(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-semibold focus:outline-none transition cursor-pointer"
            >
              <option value="">All Formats</option>
              <option value="true">Remote Only</option>
              <option value="false">Onsite / Hybrid Only</option>
            </select>
          </div>

          {/* Trigger button */}
          <div className="flex gap-2">
            {(search || location || domain || experienceLevel || remote) && (
              <button 
                type="button"
                onClick={() => {
                  setSearch('');
                  setLocation('');
                  setDomain('');
                  setExperienceLevel('');
                  setRemote('');
                  setPage(1);
                  // Trigger reload
                  setTimeout(() => fetchJobs(), 50);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold hover:bg-slate-800 text-slate-400 transition"
              >
                Clear Filters
              </button>
            )}
            <button 
              type="submit"
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-500/10"
            >
              Apply Search
            </button>
          </div>
        </div>
      </form>

      {/* Loading indicator, connection error, or results */}
      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-8 rounded-2xl max-w-xl mx-auto text-center space-y-4 animate-scale-in">
          <span className="text-4xl block">📡</span>
          <h3 className="text-lg font-bold">Network Connection Error</h3>
          <p className="text-sm text-rose-400/80">{error}</p>
          <button 
            type="button"
            onClick={fetchJobs} 
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/10"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Querying active openings...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-12 text-center">
          <span className="text-3xl">🔍</span>
          <h3 className="text-lg font-bold mt-4">No matching jobs found</h3>
          <p className="text-slate-500 text-sm mt-1">Try relaxing your search terms or selecting different filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total Jobs Label */}
          <div className="text-xs text-slate-500 font-semibold font-mono uppercase tracking-wider">
            Showing {jobs.length} of {totalCount.toLocaleString()} Matching Roles
          </div>

          {/* Jobs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between transition duration-300 relative group"
              >
                {/* Upper Details */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">{job.title}</h3>
                      <p className="text-sm font-semibold text-slate-400">{job.company_name}</p>
                    </div>
                    {/* Domain badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {job.domain}
                    </span>
                  </div>

                  {/* Location & Details Info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                    <span>📍 {job.location || 'Remote'}</span>
                    <span>💼 {job.work_type || 'Full-time'}</span>
                    <span>🎓 {job.experience_level || 'Associate'}</span>
                  </div>

                  {/* Skills tags preview */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {job.skills.slice(0, 4).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                          {s}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="text-[10px] text-slate-500 font-semibold self-center">
                          +{job.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Details (Salary & Call to action) */}
                <div className="border-t border-slate-800/60 pt-4 mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider font-mono">Normalized Salary</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      {formatSalary(job.normalized_salary, job.location)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedJobId(job.id)}
                    className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-indigo-500 hover:text-white border border-slate-850 hover:border-indigo-500 text-xs font-bold transition duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-900 pt-6">
              <button 
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/10 disabled:opacity-40 disabled:hover:border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition"
              >
                ← Previous Page
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/10 disabled:opacity-40 disabled:hover:border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition"
              >
                Next Page →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal Overlay */}
      {selectedJobId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-in">
            {detailsLoading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm">Fetching detailed profile...</p>
              </div>
            ) : selectedJob ? (
              <>
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                      {selectedJob.domain}
                    </span>
                    <h2 className="text-xl font-black text-slate-100">{selectedJob.title}</h2>
                    <p className="text-sm text-indigo-400 font-semibold">{selectedJob.company_name}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedJobId(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                  >
                    <span className="text-2xl font-bold block leading-none">&times;</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
                  {/* Job Metadata details bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider font-mono">Location</span>
                      <span className="font-semibold text-slate-300">{selectedJob.location || 'Remote'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider font-mono">Job Format</span>
                      <span className="font-semibold text-slate-300">{selectedJob.work_type || 'Full-time'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider font-mono">Experience Level</span>
                      <span className="font-semibold text-slate-300">{selectedJob.experience_level || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider font-mono">Salary Range</span>
                      <span className="font-semibold text-emerald-400">
                        {formatSalary(selectedJob.normalized_salary, selectedJob.location)}
                      </span>
                    </div>
                  </div>

                  {/* Skills Section */}
                  {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-300">Technical Skills Required:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((s, idx) => (
                          <span key={idx} className="px-3 py-1 rounded bg-slate-800 text-xs font-mono text-indigo-300 border border-slate-700/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Job Description */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-300">Job Description:</h4>
                    <div className="text-slate-400 space-y-4 whitespace-pre-wrap font-sans">
                      {selectedJob.description}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end">
                  <button 
                    onClick={() => setSelectedJobId(null)}
                    className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 font-bold rounded-xl text-xs border border-slate-800 transition"
                  >
                    Close Profile
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-rose-400">Error loading details. Close modal and try again.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
