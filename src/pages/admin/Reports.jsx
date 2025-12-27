import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Film, DollarSign, Eye, Calendar, Download, BarChart3 } from 'lucide-react';
import { 
  getDashboardStats, 
  getMonthlySummary, 
  getTopRatedMovies, 
  getGenreDistribution,
  getUserActivity,
  getNewUsers
} from '../../services/api';

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
    { label: 'Tổng lượt xem', value: (stats.totalViews || 0).toLocaleString(), icon: Eye, color: 'bg-green-500' },
    { label: 'Người dùng mới', value: totalNewUsers.toLocaleString(), icon: Users, color: 'bg-blue-500' },
    { label: 'Tổng đánh giá', value: (stats.totalReviews || 0).toLocaleString(), icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Phim mới', value: (stats.totalMovies || 0).toLocaleString(), icon: Film, color: 'bg-yellow-500' },
  ];

  const maxViews = Array.isArray(monthlySummary) && monthlySummary.length > 0
    ? Math.max(...monthlySummary.map(m => m.totalViews || 0), 1)
    : 1;
    
  const maxUsers = Array.isArray(userGrowth) && userGrowth.length > 0
    ? Math.max(...userGrowth.map(u => u.newUsers || 0), 1)
    : 1;

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

      {/* Overview Stats with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => (
          <div key={index} className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${
              stat.color === 'bg-green-500' ? 'from-emerald-500/20 to-teal-500/20' :
              stat.color === 'bg-blue-500' ? 'from-blue-500/20 to-cyan-500/20' :
              stat.color === 'bg-purple-500' ? 'from-purple-500/20 to-pink-500/20' :
              'from-amber-500/20 to-orange-500/20'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className="text-4xl font-bold text-white mt-3 tabular-nums">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${
                  stat.color === 'bg-green-500' ? 'from-emerald-500 to-teal-500' :
                  stat.color === 'bg-blue-500' ? 'from-blue-500 to-cyan-500' :
                  stat.color === 'bg-purple-500' ? 'from-purple-500 to-pink-500' :
                  'from-amber-500 to-orange-500'
                } p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts with Glass Effect */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Views Chart */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Lượt xem theo tháng</h2>
            </div>
          </div>
          {!Array.isArray(monthlySummary) || monthlySummary.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
              <p className="text-purple-200 text-lg">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-5">
              {monthlySummary.slice(0, 6).map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-purple-200">
                      {new Date(item.month).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-sm font-bold text-white backdrop-blur-lg bg-white/10 px-3 py-1 rounded-xl border border-white/20">
                      {(item.totalViews || 0).toLocaleString()} views
                    </span>
                  </div>
                  <div className="relative w-full bg-white/10 backdrop-blur-lg rounded-full h-3 overflow-hidden border border-white/20">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 shadow-lg shadow-emerald-500/50"
                      style={{ width: `${((item.totalViews || 0) / maxViews) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Growth Chart */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Người dùng mới</h2>
            </div>
          </div>
          {!Array.isArray(userGrowth) || userGrowth.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
              <p className="text-purple-200 text-lg">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-5">
              {userGrowth.slice(0, 6).map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-purple-200">
                      {new Date(item.date).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="text-sm font-bold text-white backdrop-blur-lg bg-white/10 px-3 py-1 rounded-xl border border-white/20">
                      {(item.newUsers || 0).toLocaleString()} users
                    </span>
                  </div>
                  <div className="relative w-full bg-white/10 backdrop-blur-lg rounded-full h-3 overflow-hidden border border-white/20">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700 shadow-lg shadow-blue-500/50"
                      style={{ width: `${((item.newUsers || 0) / maxUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Movies with Glass Effect */}
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

      {/* Genre Distribution */}
      {Array.isArray(genreData) && genreData.length > 0 && (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Phân bố thể loại</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genreData.map((genre, index) => (
              <div key={index} className="group backdrop-blur-lg bg-white/10 rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
                <p className="text-sm text-purple-200 mb-2 font-medium">{genre.genreName || 'N/A'}</p>
                <p className="text-3xl font-bold text-white tabular-nums">{(genre.movieCount || 0).toLocaleString()}</p>
                <p className="text-xs text-purple-300 mt-2 font-semibold uppercase">phim</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
