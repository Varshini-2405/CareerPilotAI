import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import SalaryInsights from './pages/SalaryInsights';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import CareerPlanner from './pages/CareerPlanner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="salaries" element={<SalaryInsights />} />
          <Route path="resume" element={<ResumeAnalyzer />} />
          <Route path="career" element={<CareerPlanner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
