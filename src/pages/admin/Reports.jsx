import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Film, Eye, Download, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  getDashboardStats, 
  getMonthlySummary, 
  getTopRatedMovies, 
  getGenreDistribution,
  getNewUsers
} from '../../services/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#14b8a6'];

const Reports = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [genreData, setGenreData] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);

  useEffect(() => {
    fetchReportsData();
  }, [timeRange]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
      const months = timeRange === 'year' ? 12 : 6;
      
      const [
        overviewData,
        monthlyData,
        moviesData,
        genresData,
        newUsersData
      ] = await Promise.all([
        getDashboardStats(),
        getMonthlySummary(months),
        getTopRatedMovies(5),
        getGenreDistribution(),
        getNewUsers(days)
      ]);
      
      setStats(overviewData || {});
      setMonthlySummary(Array.isArray(monthlyData) ? monthlyData : []);
      setTopMovies(Array.isArray(moviesData) ? moviesData : []);
      setGenreData(Array.isArray(genresData) ? genresData : []);
      setUserGrowth(Array.isArray(newUsersData) ? newUsersData : []);
    } catch (err) {
      console.error('Error fetching reports data:', err);
      alert('Không thể tải dữ liệu báo cáo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalNewUsers = Array.isArray(userGrowth) && userGrowth.length > 0
    ? userGrowth.reduce((sum, item) => sum + (item.newUsers || 0), 0)
    : 0;

  const overviewStats = [
    { label: 'Tổng lượt xem', value: (stats.totalViews || 0).toLocaleString(), icon: Eye, color: 'from-emerald-500 to-teal-500' },
    { label: 'Người dùng mới', value: totalNewUsers.toLocaleString(), icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Tổng đánh giá', value: (stats.totalReviews || 0).toLocaleString(), icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
    { label: 'Phim mới', value: (stats.totalMovies || 0).toLocaleString(), icon: Film, color: 'from-amber-500 to-orange-500' },
  ];

  const handleExport = () => {
    const data = {
      overview: stats,
      monthlySummary,
      topMovies,
      genreDistribution: genreData,
      userGrowth,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format data for charts
  const formattedMonthlyData = monthlySummary.map(item => ({
    month: new Date(item.month).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
    views: item.totalViews || 0
  }));

  const formattedUserGrowth = userGrowth.map(item => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    users: item.newUsers || 0
  }));

  const formattedGenreData = genreData.map(item => ({
    name: item.genreName,
    value: item.movieCount || 0
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-white text-lg font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 space-y-6">
      {/* Header with Glass Effect */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/50">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Thống kê & Báo cáo
              </h1>
              <p className="text-purple-200 mt-1 text-lg">Xem báo cáo chi tiết về hoạt động hệ thống</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select 
              className="px-6 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all font-semibold cursor-pointer"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week" className="bg-slate-800">7 ngày qua</option>
              <option value="month" className="bg-slate-800">30 ngày qua</option>
              <option value="quarter" className="bg-slate-800">3 tháng qua</option>
              <option value="year" className="bg-slate-800">1 năm qua</option>
            </select>
            <button 
              onClick={handleExport}
              className="backdrop-blur-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:scale-105 border border-white/20 font-semibold"
            >
              <Download className="w-5 h-5" />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => (
          <div key={index} className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className="text-4xl font-bold text-white mt-3 tabular-nums">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Views Bar Chart */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Lượt xem theo tháng</h2>
          </div>
          {formattedMonthlyData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
              <p className="text-purple-200 text-lg">Chưa có dữ liệu</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="views" fill="url(#colorViews)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Growth Line Chart */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Người dùng mới</h2>
          </div>
          {formattedUserGrowth.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
              <p className="text-purple-200 text-lg">Chưa có dữ liệu</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                <YAxis stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Genre Distribution Pie Chart */}
      {formattedGenreData.length > 0 && (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Phân bố thể loại</h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={formattedGenreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={140}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formattedGenreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Movies Table */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/50">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Top phim đánh giá cao nhất</h2>
          </div>
        </div>
        {!Array.isArray(topMovies) || topMovies.length === 0 ? (
          <div className="p-12 text-center">
            <Film className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
            <p className="text-purple-200 text-lg">Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Hạng</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Tên phim</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Đánh giá</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Số reviews</th>
                </tr>
              </thead>
              <tbody>
                {topMovies.map((movie, index) => (
                  <tr key={movie.movieId || index} className="border-b border-white/5 hover:bg-white/10 transition-all duration-200 group">
                    <td className="py-5 px-8">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/50' : 
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-400/50' : 
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/50' : 
                        'bg-gradient-to-br from-slate-500 to-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="font-semibold text-white text-lg group-hover:text-cyan-300 transition-colors">
                        {movie.title || 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="inline-flex items-center gap-2 backdrop-blur-lg bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
                        <span className="text-amber-400 text-xl">★</span>
                        <span className="text-white font-bold text-lg tabular-nums">
                          {movie.averageRating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="text-purple-200 font-medium text-lg tabular-nums">
                        {(movie.reviewCount || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
