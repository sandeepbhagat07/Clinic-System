
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';

interface LoginProps {
  onLogin: (role: AppView) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [appName, setAppName] = useState('Clinic-Q');

  useEffect(() => {
    fetch('/api/metadata')
      .then(res => res.json())
      .then(data => {
        if (data.hospitalName) {
          setHospitalName(data.hospitalName);
        }
        if (data.appName) {
          setAppName(data.appName);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, mobile })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.token) {
          localStorage.setItem('clinicflow_authToken', data.token);
        }
        onLogin(data.role as AppView);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-700 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-black text-indigo-900 tracking-widest">{appName}</h2>
          {hospitalName && (
            <p className="mt-1 text-indigo-600 font-bold uppercase tracking-wider text-lg">{hospitalName}</p>
          )}
         
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
            <input
              type="tel"
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              placeholder="Enter Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-4 rounded-2xl shadow-xl transition-all transform active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
          >
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
