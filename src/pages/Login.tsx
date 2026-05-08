import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, resendConfirmation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('patient@clinova.com');
  const [password, setPassword] = useState('patient123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        const message = signInError.message || 'Failed to sign in';
        const emailNotConfirmed = /confirm|confirmed/i.test(message);
        setNeedsConfirmation(emailNotConfirmed);
        throw new Error(
          emailNotConfirmed
            ? 'Email not confirmed. Please confirm your email to continue.'
            : message
        );
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('');
    const { error: resendError } = await resendConfirmation(email);
    if (resendError) {
      setResendStatus(resendError.message || 'Failed to resend confirmation email');
      return;
    }
    setResendStatus('Confirmation email sent. Please check your inbox.');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Gradient/Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-blue to-primary-cyan relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,1)_0%,rgba(0,0,0,0)_100%)]"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">CliniNova</h1>
          <p className="text-blue-100 text-lg max-w-md">Your personal AI healthcare assistant. Manage records, set reminders, and chat with your medical AI anytime.</p>
        </div>
        <div className="relative z-10">
          <div className="card-container p-6 bg-white/10 backdrop-blur-md border border-white/20 text-white max-w-sm rounded-2xl">
            <p className="italic">"CliniNova completely changed how I manage my family's health records and reminders. Highly recommended!"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full"></div>
              <div>
                <p className="font-bold">Sarah T.</p>
                <p className="text-xs text-blue-200">Verified User</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-bg">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome Back</h2>
            <p className="text-text-secondary">Sign in to access your health dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {error && <div className="p-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>}
            {needsConfirmation && (
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-medium flex items-center justify-between gap-3">
                <span>Email not confirmed. Check your inbox or resend the confirmation email.</span>
                <button type="button" onClick={handleResend} className="text-primary-blue font-semibold hover:underline">
                  Resend
                </button>
              </div>
            )}
            {resendStatus && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">{resendStatus}</div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-text-secondary">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary-blue hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center mt-6 py-3 text-lg"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-text-primary">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-blue font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
