import React, { useState, useEffect } from 'react';
import { Search, Star, MessageSquare, Trash2, Calendar, User as UserIcon, Film, TrendingUp, Award } from 'lucide-react';
import { 
  getAllReviews, 
  getReviewsByRating, 
  deleteReview
} from '../../services/api';

const RatingManagement = () => {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchRatings();
  }, [filterRating, searchTerm]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      let data;
      
      if (filterRating !== 'all') {
        data = await getReviewsByRating(filterRating);
      } else {
        data = await getAllReviews();
      }
      
      // Transform reviews data
      data = Array.isArray(data) ? data.map(review => ({
        id: review.id,
        userName: review.userName || review.user?.username || 'Người dùng',
        movieTitle: review.movieTitle || review.movie?.title || 'N/A',
        rating: review.rating || 0,
        comment: review.comment || 'Không có nhận xét',
        createdAt: review.createdAt,
      })) : [];
      
      // Filter by search term if provided
      if (searchTerm) {
        data = data.filter(item => 
          item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.movieTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.comment.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Calculate average rating
      const avgRating = data.length > 0 
        ? (data.reduce((sum, item) => sum + item.rating, 0) / data.length).toFixed(1)
        : 0;
      
      setRatings(data);
      setStats({
        total: data.length,
        approved: data.length,
        averageRating: parseFloat(avgRating)
      });
    } catch (err) {
      console.error('Error fetching ratings:', err);
      alert('Không thể tải danh sách đánh giá: ' + err.message);
      setRatings([]);
      setStats({ total: 0, approved: 0, averageRating: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ratingId) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác.')) return;
    
    try {
      setProcessing(ratingId);
      await deleteReview(ratingId);
      setRatings(ratings.filter(r => r.id !== ratingId));
      alert('Đã xóa đánh giá');
      
      // Recalculate stats
      const newRatings = ratings.filter(r => r.id !== ratingId);
      const avgRating = newRatings.length > 0 
        ? (newRatings.reduce((sum, item) => sum + item.rating, 0) / newRatings.length).toFixed(1)
        : 0;
      
      setStats({
        total: newRatings.length,
        approved: newRatings.length,
        averageRating: parseFloat(avgRating)
      });
    } catch (err) {
      alert('Không thể xóa đánh giá: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const statsConfig = [
    { 
      label: 'Tổng đánh giá', 
      value: stats.total, 
      icon: MessageSquare, 
      gradient: 'from-blue-500/80 to-cyan-500/80',
      glow: 'shadow-blue-500/50'
    },
    { 
      label: 'Đánh giá trung bình', 
      value: `${stats.averageRating}/10`, 
      icon: Award, 
      gradient: 'from-amber-500/80 to-orange-500/80',
      glow: 'shadow-amber-500/50'
    },
    { 
      label: 'Đã duyệt', 
      value: stats.approved, 
      icon: TrendingUp, 
      gradient: 'from-emerald-500/80 to-teal-500/80',
      glow: 'shadow-emerald-500/50'
    },
  ];

  const renderStars = (rating) => {
    const stars = Math.round((rating / 10) * 5);
    const fullStars = Math.floor(stars);
    const hasHalfStar = stars % 1 !== 0;
    
    return (
      <div className="flex gap-0.5 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            className={`${
              star <= fullStars 
                ? 'text-yellow-400 fill-yellow-400' 
                : star === fullStars + 1 && hasHalfStar
                ? 'text-yellow-400 fill-yellow-200'
                : 'text-gray-300 fill-gray-100'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-gray-700">{rating}/10</span>
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (rating >= 4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Quản lý đánh giá
            </h1>
            <p className="text-purple-200 mt-1 text-lg">Theo dõi và quản lý phản hồi từ người dùng</p>
          </div>
        </div>
      </div>

      {/* Stats Cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsConfig.map((stat, index) => (
          <div 
            key={index} 
            className="group relative backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className="text-4xl font-bold text-white mt-3 tabular-nums">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter with Glass Effect */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phim, người dùng, nhận xét..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-6 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all font-semibold min-w-[200px] cursor-pointer"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="all" className="bg-slate-800">⭐ Tất cả đánh giá</option>
            <option value="10" className="bg-slate-800">10 điểm - Xuất sắc</option>
            <option value="9" className="bg-slate-800">9 điểm - Rất tốt</option>
            <option value="8" className="bg-slate-800">8 điểm - Tốt</option>
            <option value="7" className="bg-slate-800">7 điểm - Khá tốt</option>
            <option value="6" className="bg-slate-800">6 điểm - Trung bình</option>
            <option value="5" className="bg-slate-800">5 điểm - Tạm được</option>
            <option value="4" className="bg-slate-800">4 điểm - Dưới TB</option>
            <option value="3" className="bg-slate-800">3 điểm - Kém</option>
            <option value="2" className="bg-slate-800">2 điểm - Rất kém</option>
            <option value="1" className="bg-slate-800">1 điểm - Tệ</option>
          </select>
        </div>
      </div>

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 text-center border border-white/20">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-purple-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {searchTerm || filterRating !== 'all' ? 'Không tìm thấy đánh giá' : 'Chưa có đánh giá nào'}
          </h3>
          <p className="text-purple-200 text-lg">
            {searchTerm || filterRating !== 'all' 
              ? 'Thử điều chỉnh bộ lọc để xem thêm kết quả' 
              : 'Đánh giá từ người dùng sẽ xuất hiện ở đây'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div 
              key={rating.id} 
              className="group backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 hover:bg-white/20 transition-all duration-300 overflow-hidden hover:shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                      <span className="text-2xl font-bold text-white">
                        {rating.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl backdrop-blur-lg border-2 border-white ${
                      rating.rating >= 8 ? 'bg-emerald-500/80' : 
                      rating.rating >= 6 ? 'bg-amber-500/80' : 
                      'bg-red-500/80'
                    } flex items-center justify-center shadow-lg`}>
                      <span className="text-xs font-bold text-white">{rating.rating}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="w-5 h-5 text-purple-300" />
                          <h3 className="font-bold text-white text-lg truncate">{rating.userName}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Film className="w-5 h-5 text-cyan-400" />
                          <span className="font-semibold text-cyan-300 truncate text-lg">{rating.movieTitle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 backdrop-blur-lg bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                        <Calendar className="w-4 h-4 text-purple-300" />
                        <span className="text-sm text-purple-200 font-medium">
                          {rating.createdAt 
                            ? new Date(rating.createdAt).toLocaleDateString('vi-VN', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Rating Stars */}
                    <div className="mb-4">
                      {renderStars(rating.rating)}
                    </div>

                    {/* Comment */}
                    <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-5 mb-4 border border-white/20">
                      <p className="text-purple-100 leading-relaxed break-words text-lg">
                        "{rating.comment}"
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleDelete(rating.id)}
                        disabled={processing === rating.id}
                        className="group/btn relative px-6 py-3 backdrop-blur-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-2xl transition-all flex items-center gap-2 font-semibold border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-500/20 hover:scale-105"
                      >
                        <Trash2 className="w-5 h-5" />
                        {processing === rating.id ? 'Đang xóa...' : 'Xóa đánh giá'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {ratings.length > 0 && (
        <div className="text-center backdrop-blur-lg bg-white/10 rounded-2xl py-4 px-6 border border-white/20">
          <p className="text-purple-200 font-medium">
            Hiển thị <span className="text-white font-bold">{ratings.length}</span> đánh giá
          </p>
        </div>
      )}
    </div>
  );
};

export default RatingManagement;
