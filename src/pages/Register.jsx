import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'student',
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      if (data?.session) {
        navigate('/');
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-6">
      <form
        onSubmit={handleRegister}
        className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-xs space-y-5"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-800 text-teal-300 rounded-xl flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Student Registration</h2>
          <p className="text-xs text-zinc-500">Create your candidate profile to access assessments.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              className="w-full border border-zinc-200 bg-zinc-50/50 p-3 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="candidate@institution.edu"
              className="w-full border border-zinc-200 bg-zinc-50/50 p-3 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-1">
              Password
            </label>
            <input
              type="password"
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full border border-zinc-200 bg-zinc-50/50 p-3 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register as Candidate'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-center text-zinc-500">
          Already registered?{' '}
          <Link to="/login" className="text-teal-800 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}