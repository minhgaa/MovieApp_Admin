import React, { useState, useEffect } from 'react';
import { Users, Film, TrendingUp, Eye } from 'lucide-react';
import { getDashboardStats, getTopRatedMovies, getMovieById, getViewsByMovieId, getStaticFileUrl } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMovies: 0,
    totalReviews: 0,
    totalViews: 0,
    activeUsersLast30Days: 0
  });
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, moviesData] = await Promise.all([
        getDashboardStats(),
        getTopRatedMovies(5)
      ]);
      
      setStats(overviewData || {});
      
      // Fetch additional data for each movie
      if (Array.isArray(moviesData) && moviesData.length > 0) {
        const moviesWithDetails = await Promise.all(
          moviesData.map(async (movie) => {
            try {
              const [movieDetails, viewsData] = await Promise.all([
                getMovieById(movie.movieId),
                getViewsByMovieId(movie.movieId)
              ]);
              
              return {
                ...movie,
                posterUrl: movieDetails?.posterUrl,
                viewCount: viewsData?.totalViews ?? 0
              };
            } catch (err) {
              console.error(`Error fetching details for movie ${movie.movieId}:`, err);
              return {
                ...movie,
                posterUrl: null,
                viewCount: 0
              };
            }
          })
        );
        setTopMovies(moviesWithDetails);
      } else {
        setTopMovies([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      alert('Không thể tải dữ liệu dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { 
      name: 'Tổng người dùng', 
      value: stats.totalUsers?.toLocaleString() || '0', 
      icon: Users, 
      gradient: 'from-blue-500/80 to-cyan-500/80',
      glow: 'shadow-blue-500/50',
      subtext: `${stats.activeUsersLast30Days || 0} hoạt động (30 ngày)`
    },
    { 
      name: 'Tổng phim', 
      value: stats.totalMovies?.toLocaleString() || '0', 
      icon: Film, 
      gradient: 'from-purple-500/80 to-pink-500/80',
      glow: 'shadow-purple-500/50'
    },
    { 
      name: 'Lượt xem', 
      value: stats.totalViews?.toLocaleString() || '0', 
      icon: Eye, 
      gradient: 'from-emerald-500/80 to-teal-500/80',
      glow: 'shadow-emerald-500/50'
    },
    { 
      name: 'Đánh giá', 
      value: stats.totalReviews?.toLocaleString() || '0', 
      icon: TrendingUp, 
      gradient: 'from-amber-500/80 to-orange-500/80',
      glow: 'shadow-amber-500/50'
    },
  ];

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
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Film className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-purple-200 mt-1 text-lg">Tổng quan hệ thống quản lý phim</p>
          </div>
        </div>
      </div>

      {/* Stats Grid with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div 
            key={index} 
            className="group relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden"
          >
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">{stat.name}</p>
                  <p className="text-4xl font-bold text-white mt-3 tabular-nums">{stat.value}</p>
                  {stat.subtext && (
                    <p className="text-sm text-purple-300 mt-3 font-medium">{stat.subtext}</p>
                  )}
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Rated Movies with Glass Effect */}
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
            <p className="text-purple-200 text-lg">Chưa có dữ liệu phim</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Hạng</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Poster</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Tên phim</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Đánh giá</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Lượt xem</th>
                  <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Số reviews</th>
                </tr>
              </thead>
              <tbody>
                {topMovies.map((movie, index) => (
                  <tr 
                    key={movie.movieId || index} 
                    className="border-b border-white/5 hover:bg-white/10 transition-all duration-200 group"
                  >
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
                      <div className="w-16 h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 group-hover:scale-105 transition-transform duration-300">
                        {movie.posterUrl ? (
                          <img
                            src={getStaticFileUrl(movie.posterUrl)}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64x96?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Film className="w-8 h-8 text-white" />
                          </div>
                        )}
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
                      <div className="inline-flex items-center gap-2 backdrop-blur-lg bg-cyan-500/20 px-4 py-2 rounded-xl border border-cyan-500/30">
                        <Eye className="w-5 h-5 text-cyan-300" />
                        <span className="text-white font-bold text-lg tabular-nums">
                          {(movie.viewCount || 0).toLocaleString()}
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

export default Dashboard;
