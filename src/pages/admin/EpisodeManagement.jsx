import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Upload, Play, 
  Clock, Calendar, X, Crown, Unlock, Eye, Star, 
  MessageCircle, User, TrendingUp 
} from 'lucide-react';
import { 
  getMovieById, 
  getEpisodes, 
  createEpisodeWithVideo, 
  deleteEpisode, 
  updateEpisode, 
  replaceEpisodeVideo, 
  getStaticFileUrl, 
  TogglePremium,
  getViewsByMovieId,
  getReviewsByMovie,
  deleteReview
} from '../../services/api';

const EpisodeManagement = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  
  // Data States
  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [views, setViews] = useState(0);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' | 'reviews'
  const [showModal, setShowModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Functional States
  const [currentVideo, setCurrentVideo] = useState(null);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    episodeNumber: '',
    title: '',
    description: '',
    duration: '',
    releaseDate: '',
    videoFile: null
  });

  useEffect(() => {
    fetchMovieData();
  }, [movieId]);

  const toUtcDateString = (dateStr) => `${dateStr}T00:00:00Z`;

  const fetchMovieData = async () => {
    try {
      setLoading(true);
      // Fetch all necessary data in parallel
      const [movieData, episodesData, viewsData, reviewsData] = await Promise.all([
        getMovieById(movieId),
        getEpisodes(movieId),
        getViewsByMovieId(movieId).catch(() => ({ count: 0 })), // Handle error gracefully
        getReviewsByMovie(movieId).catch(() => []) // Handle error gracefully
      ]);

      setMovie(movieData);
      setEpisodes(episodesData);
      
      // Handle Views Data (assuming API returns object with count or raw number)
      const viewCount = typeof viewsData === 'number' ? viewsData : (viewsData?.count || 0);
      setViews(viewCount);

      // Handle Reviews
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);

    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Không thể tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- REVIEW HANDLERS ---
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác.')) return;
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      alert('Đã xóa đánh giá thành công');
    } catch (err) {
      alert('Lỗi khi xóa đánh giá: ' + err.message);
    }
  };

  // --- EPISODE MODAL HANDLERS ---
  const openCreateModal = () => {
    setEditingEpisode(null);
    setFormData({
      episodeNumber: episodes.length + 1,
      title: '',
      description: '',
      duration: '',
      releaseDate: new Date().toISOString().split('T')[0],
      videoFile: null
    });
    setShowModal(true);
  };

  const openEditModal = (episode) => {
    setEditingEpisode(episode);
    setFormData({
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      description: episode.description || '',
      duration: episode.duration || '',
      releaseDate: episode.releaseDate ? episode.releaseDate.split('T')[0] : '',
      videoFile: null
    });
    setShowModal(true);
  };

  const openVideoModal = (episode) => {
    setCurrentVideo(episode);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setCurrentVideo(null);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('File video quá lớn! Tối đa 500MB');
        return;
      }
      if (!file.type.startsWith('video/')) {
        alert('Vui lòng chọn file video');
        return;
      }
      setFormData(prev => ({ ...prev, videoFile: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      setUploadProgress(0);

      if (editingEpisode) {
        const episodeData = {
          episodeNumber: parseInt(formData.episodeNumber),
          title: formData.title,
          description: formData.description,
          duration: parseInt(formData.duration) || 0,
          releaseDate: new Date(formData.releaseDate).toISOString()
        };
        
        await updateEpisode(movieId, editingEpisode.id, episodeData);
        
        if (formData.videoFile) {
          const interval = setInterval(() => setUploadProgress(prev => Math.min(prev + 10, 90)), 500);
          await replaceEpisodeVideo(movieId, editingEpisode.id, formData.videoFile);
          clearInterval(interval);
          setUploadProgress(100);
        }
        alert('Cập nhật thành công!');
      } else {
        if (!formData.videoFile) {
          alert('Vui lòng chọn file video');
          setUploading(false);
          return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('episodeNumber', formData.episodeNumber);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('duration', formData.duration || '0');
        formDataToSend.append('releaseDate', toUtcDateString(formData.releaseDate));
        formDataToSend.append('videoFile', formData.videoFile);

        const interval = setInterval(() => setUploadProgress(prev => Math.min(prev + 10, 90)), 500);
        await createEpisodeWithVideo(movieId, formDataToSend);
        clearInterval(interval);
        setUploadProgress(100);
        alert('Thêm tập phim thành công!');
      }
      
      setShowModal(false);
      fetchMovieData(); // Refresh list
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (episodeId, episodeTitle) => {
    if (!confirm(`Bạn có chắc muốn xóa tập "${episodeTitle}"?`)) return;
    try {
      await deleteEpisode(movieId, episodeId);
      setEpisodes(episodes.filter(e => e.id !== episodeId));
      alert('Xóa tập phim thành công!');
    } catch (err) {
      alert('Không thể xóa tập phim: ' + err.message);
    }
  };

  const handleTogglePremium = async (episodeId, isPremium, episodeTitle) => {
    const action = isPremium ? 'miễn phí' : 'premium';
    if (!confirm(`Bạn có chắc muốn đặt tập "${episodeTitle}" thành ${action}?`)) return;
    try {
      await TogglePremium(movieId, episodeId, !isPremium);
      setEpisodes(episodes.map(e => e.id === episodeId ? { ...e, isPremium: !isPremium } : e));
      alert(`Đã cập nhật trạng thái thành công!`);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- HELPERS ---
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(num);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star 
        key={index} 
        className={`w-4 h-4 ${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} 
      />
    ));
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
      
      {/* --- HEADER --- */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/movies')}
            className="p-3 backdrop-blur-lg bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/20 hover:border-white/30 group"
          >
            <ArrowLeft className="w-6 h-6 text-purple-200 group-hover:text-white transition-colors" />
          </button>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Play className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Quản lý nội dung
              </h1>
              <p className="text-purple-200 mt-1 text-lg">
                Phim: <span className="font-bold text-white">{movie?.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="group relative backdrop-blur-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 border border-white/20"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Thêm tập mới</span>
          </button>
        </div>
      </div>

      {/* --- MOVIE INFO & STATS --- */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="relative group shrink-0 mx-auto md:mx-0">
            <img
              src={getStaticFileUrl(movie?.posterUrl) || 'https://via.placeholder.com/200x300'}
              alt={movie?.title}
              className="w-48 h-72 object-cover rounded-2xl shadow-2xl border-2 border-white/30 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300'; }}
            />
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-start">
               <h2 className="text-3xl font-bold text-white mb-3">{movie?.title}</h2>
               
            </div>
            
            <p className="text-purple-100 mb-6 leading-relaxed text-lg line-clamp-3 hover:line-clamp-none transition-all">
              {movie?.description}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Năm phát hành */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                  <Calendar className="w-4 h-4" /> Năm phát hành
                </div>
                <p className="text-white font-bold text-2xl">{movie?.releaseYear}</p>
              </div>

              {/* Stat 2: Tổng số tập */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                  <Play className="w-4 h-4" /> Tổng số tập
                </div>
                <p className="text-white font-bold text-2xl">{episodes.length} <span className="text-sm font-normal text-purple-300">tập</span></p>
              </div>

              {/* Stat 3: Đánh giá */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                  <Star className="w-4 h-4 text-yellow-400" /> Đánh giá
                </div>
                <div className="flex items-end gap-2">
                   <p className="text-white font-bold text-2xl">{movie?.rating?.toFixed(1) || 'N/A'}</p>
                   <p className="text-purple-300 text-sm mb-1">/ 5.0</p>
                </div>
              </div>

              {/* Stat 4: Lượt xem */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                  <Eye className="w-4 h-4 text-cyan-400" /> Lượt xem
                </div>
                <div className="flex items-end gap-2">
                   <p className="text-white font-bold text-2xl">{formatNumber(views)}</p>
                   <TrendingUp className="w-4 h-4 text-green-400 mb-1.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABS NAVIGATION --- */}
      <div className="flex items-center gap-4 border-b border-white/10 px-4">
        <button
          onClick={() => setActiveTab('episodes')}
          className={`pb-4 px-2 font-semibold text-lg transition-all relative ${
            activeTab === 'episodes' ? 'text-white' : 'text-purple-300 hover:text-white'
          }`}
        >
          Danh sách tập phim
          {activeTab === 'episodes' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full shadow-[0_-2px_10px_rgba(168,85,247,0.5)]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 px-2 font-semibold text-lg transition-all relative flex items-center gap-2 ${
            activeTab === 'reviews' ? 'text-white' : 'text-purple-300 hover:text-white'
          }`}
        >
          Đánh giá & Bình luận
          <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs border border-white/10">
            {reviews.length}
          </span>
          {activeTab === 'reviews' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-full shadow-[0_-2px_10px_rgba(6,182,212,0.5)]"></div>
          )}
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      {activeTab === 'episodes' ? (
        // === EPISODES GRID ===
        episodes.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 text-center border border-white/20">
            <Play className="w-20 h-20 text-purple-300/50 mx-auto mb-4" />
            <p className="text-purple-200 text-xl mb-4">Chưa có tập phim nào</p>
            <button
              onClick={openCreateModal}
              className="backdrop-blur-lg bg-purple-500/80 hover:bg-purple-600/90 text-white px-6 py-3 rounded-2xl font-semibold transition-all border border-white/30 shadow-lg hover:scale-105"
            >
              Thêm tập đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((episode) => (
              <div key={episode.id} className="group backdrop-blur-xl bg-white/10 rounded-3xl overflow-hidden hover:bg-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-105 border border-white/20">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 cursor-pointer" onClick={() => openVideoModal(episode)}>
                  <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/40 transition-all">
                    <Play className="w-20 h-20 text-white opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all drop-shadow-2xl" />
                  </div>
                  <div className="absolute top-3 left-3 backdrop-blur-lg bg-black/60 text-white px-4 py-2 rounded-xl font-bold border border-white/30 shadow-lg">
                    Tập {episode.episodeNumber}
                  </div>
                  {episode.isPremium && (
                    <div className="absolute top-3 right-3 backdrop-blur-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 border border-white/30 shadow-lg shadow-amber-500/50">
                      <Crown className="w-4 h-4" />
                      <span className="font-bold text-sm">PREMIUM</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 backdrop-blur-lg bg-black/60 text-white px-3 py-2 rounded-xl flex items-center gap-2 border border-white/30 shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{formatDuration(episode.duration)}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">{episode.title}</h3>
                  <p className="text-sm text-purple-200 mb-4 line-clamp-2">{episode.description || 'Chưa có mô tả'}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-purple-300 mb-4 backdrop-blur-lg bg-white/10 px-3 py-2 rounded-xl border border-white/20 w-fit">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {episode.releaseDate ? new Date(episode.releaseDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => openVideoModal(episode)} className="flex-1 px-3 py-2 bg-blue-500/80 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all">Xem</button>
                    <button onClick={() => openEditModal(episode)} className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all">Sửa</button>
                    <button onClick={() => handleDelete(episode.id, episode.title)} className="flex-1 px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all">Xóa</button>
                  </div>

                  <button
                    onClick={() => handleTogglePremium(episode.id, episode.isPremium, episode.title)}
                    className={`w-full px-4 py-2 mt-2 backdrop-blur-lg ${
                      episode.isPremium 
                        ? 'bg-gradient-to-r from-amber-500/80 to-yellow-500/80 hover:from-amber-600' 
                        : 'bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600'
                    } text-white rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-lg`}
                  >
                    {episode.isPremium ? <><Unlock className="w-4 h-4" /> Đặt Miễn phí</> : <><Crown className="w-4 h-4" /> Đặt Premium</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // === REVIEWS LIST ===
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-12 text-center border border-white/10">
              <MessageCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Chưa có đánh giá nào cho phim này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
               {reviews.map((review) => (
                 <div key={review.id} className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all flex gap-4">
                   {/* User Avatar */}
                   <div className="flex-shrink-0">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                     </div>
                   </div>
                   
                   {/* Content */}
                   <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-bold text-lg">{review.userName || 'Người dùng ẩn danh'}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-slate-400 text-sm ml-2">
                              • {new Date(review.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteReview(review.id)}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-3 bg-black/20 p-4 rounded-xl border border-white/5">
                        <p className="text-purple-100/90 leading-relaxed italic">
                          "{review.comment}"
                        </p>
                      </div>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* --- VIDEO PLAYER MODAL --- */}
      {showVideoModal && currentVideo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl">
            <div className="backdrop-blur-2xl bg-slate-900/90 rounded-t-3xl px-8 py-5 flex items-center justify-between border border-white/20 border-b-0">
              <div className="flex-1 pr-4">
                <h3 className="text-2xl font-bold text-white mb-1">
                  Tập {currentVideo.episodeNumber}: {currentVideo.title}
                </h3>
              </div>
              <button
                onClick={closeVideoModal}
                className="flex-shrink-0 p-3 bg-white/10 hover:bg-red-500/80 rounded-2xl transition-all border border-white/20 hover:border-red-500/50 group"
              >
                <X className="w-6 h-6 text-purple-200 group-hover:text-white" />
              </button>
            </div>

            <div className="bg-black aspect-video border-x border-white/20">
              <video
                className="w-full h-full"
                controls
                autoPlay
                controlsList="nodownload"
                src={getStaticFileUrl(currentVideo.videoUrl)}
                onError={(e) => { console.error('Video error:', e); alert('Không thể tải video.'); }}
              >
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>

            <div className="backdrop-blur-2xl bg-slate-900/90 rounded-b-3xl px-8 py-4 flex items-center justify-between border border-white/20 border-t-0">
              <div className="flex items-center gap-6">
                 {/* Stats inside player footer */}
              </div>
              <button onClick={closeVideoModal} className="px-6 py-3 bg-red-500/80 hover:bg-red-600 text-white rounded-2xl font-semibold transition-all">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE/EDIT EPISODE MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-2xl bg-slate-900/95 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {editingEpisode ? 'Chỉnh sửa tập phim' : 'Thêm tập mới'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} disabled={uploading} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-purple-200" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">Số tập <span className="text-red-400">*</span></label>
                  <input type="number" name="episodeNumber" value={formData.episodeNumber} onChange={handleChange} className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-cyan-400" min="1" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">Tên tập <span className="text-red-400">*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-cyan-400" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">Mô tả</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-cyan-400 resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">Thời lượng (phút)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleChange} className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-cyan-400" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">Ngày phát hành <span className="text-red-400">*</span></label>
                  <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange} className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-cyan-400" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  File video {!editingEpisode && <span className="text-red-400">*</span>}
                </label>
                <label className="flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed border-white/30 rounded-2xl hover:border-cyan-400 cursor-pointer transition-all bg-white/5 hover:bg-white/10">
                  <Upload className="w-10 h-10 text-purple-300" />
                  <div className="text-center">
                    <span className="text-purple-200 font-medium block mb-1">
                      {formData.videoFile ? formData.videoFile.name : (editingEpisode ? 'Chọn video mới để thay thế (tùy chọn)' : 'Chọn file video để upload')}
                    </span>
                    {formData.videoFile && <span className="text-sm text-cyan-300 font-semibold">{(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB</span>}
                  </div>
                  <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" required={!editingEpisode} />
                </label>
              </div>

              {uploading && (
                <div className="bg-blue-500/20 rounded-2xl p-5 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-blue-200">{uploadProgress < 100 ? 'Đang tải lên...' : 'Hoàn thành!'}</span>
                    <span className="font-bold text-blue-200 text-lg">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-900/50 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-purple-200 rounded-2xl font-semibold transition-all" disabled={uploading}>Hủy</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold transition-all shadow-lg disabled:opacity-50" disabled={uploading}>
                  {uploading ? 'Đang xử lý...' : (editingEpisode ? 'Cập nhật' : 'Thêm tập')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeManagement;