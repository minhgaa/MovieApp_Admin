import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { login } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      console.log('Login successful:', response);
      
      // Lưu token vào localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      // Lưu user info vào localStorage (response chứa trực tiếp user info)
      const userInfo = {
        userId: response.userId,
        username: response.username,
        email: response.email,
        name: response.name,
        avatarUrl: response.avatarUrl
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // Chuyển hướng đến admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title with Glass Effect */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl mb-6 border border-white/20 group hover:scale-110 transition-transform duration-300">
            <Film className="w-10 h-10 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-3">
            MovieApp Admin
          </h1>
          <p className="text-purple-200 text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Đăng nhập để quản lý hệ thống
          </p>
        </div>

        {/* Login Form with Glassmorphism */}
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border-b border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white text-center">Đăng nhập</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Email Input with Glass Effect */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-purple-200 uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 backdrop-blur-lg bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                  placeholder="admin@movieapp.com"
                  required
                />
              </div>
            </div>

            {/* Password Input with Glass Effect */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-purple-200 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-14 py-4 backdrop-blur-lg bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl text-purple-300 hover:text-white transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message with Glass Effect */}
            {error && (
              <div className="backdrop-blur-lg bg-red-500/20 border-2 border-red-500/30 text-red-200 px-5 py-4 rounded-2xl shadow-lg animate-shake">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button with Gradient */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 border border-white/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                <>
                  <span className="relative z-10">Đăng nhập</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="backdrop-blur-lg bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
              <a href="#" className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold transition-colors inline-flex items-center gap-2 group">
                Quên mật khẩu?
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="mt-6 backdrop-blur-xl bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20">
          <p className="text-sm text-blue-200 text-center font-medium mb-2">
            💡 Demo Credentials
          </p>
          <div className="text-xs text-purple-300 space-y-1">
            <p className="font-mono">Email: admin@movieapp.com</p>
            <p className="font-mono">Password: admin123</p>
          </div>
        </div>

        {/* Copyright with Glass Effect */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm backdrop-blur-lg bg-white/5 inline-block px-6 py-3 rounded-full border border-white/10">
            © 2024 MovieApp. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
