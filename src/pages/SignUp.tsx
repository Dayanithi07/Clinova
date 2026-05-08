import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp, resendConfirmation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationNotice, setConfirmationNotice] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setConfirmationNotice('');
    try {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      const { error: signUpError, needsEmailConfirmation } = await signUp(email, password, name);
      if (signUpError) {
        throw new Error(signUpError.message);
      }
      if (needsEmailConfirmation) {
        setConfirmationNotice('Check your inbox to confirm your email before signing in.');
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const { error: resendError } = await resendConfirmation(email);
    if (resendError) {
      setError(resendError.message || 'Failed to resend confirmation email');
      return;
    }
    setConfirmationNotice('Confirmation email sent. Please check your inbox.');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Gradient/Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-cyan to-primary-blue relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,1)_0%,rgba(0,0,0,0)_100%)]"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">Join CliniNova</h1>
          <p className="text-blue-100 text-lg max-w-md">Take control of your health journey. Sign up today and experience the future of personal healthcare.</p>
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
            <h2 className="text-3xl font-bold text-text-primary mb-2">Create Account</h2>
            <p className="text-text-secondary">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {error && <div className="p-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>}
            {confirmationNotice && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium flex items-center justify-between gap-3">
                <span>{confirmationNotice}</span>
                <button type="button" onClick={handleResend} className="text-primary-blue font-semibold hover:underline">
                  Resend
                </button>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
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
                'Sign Up'
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-blue font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
