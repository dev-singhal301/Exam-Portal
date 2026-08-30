import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form onSubmit={handleLogin} className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Login to SecureExam</h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full border p-3 rounded-xl text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-xl text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
            Sign In
          </button>
        </div>
        <p className="text-xs text-center text-slate-500 mt-4">
          Don't have an account? <Link to="/register" className="text-indigo-600 font-semibold">Register</Link>
        </p>
      </form>
    </div>
  );
}