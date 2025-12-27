import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Upload, Play, Clock, Calendar, X } from 'lucide-react';
import { getMovieById, getEpisodes, createEpisodeWithVideo, deleteEpisode, updateEpisode, replaceEpisodeVideo, getStaticFileUrl } from '../../services/api';

const EpisodeManagement = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
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
    fetchMovieAndEpisodes();
  }, [movieId]);

  const fetchMovieAndEpisodes = async () => {
    try {
      setLoading(true);
      const [movieData, episodesData] = await Promise.all([
        getMovieById(movieId),
        getEpisodes(movieId)
      ]);
      setMovie(movieData);
      setEpisodes(episodesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Không thể tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('File video quá lớn! Tối đa 500MB');
        return;
      }
      
      // Check file type
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
        // Update episode metadata
        const episodeData = {
          episodeNumber: parseInt(formData.episodeNumber),
          title: formData.title,
          description: formData.description,
          duration: parseInt(formData.duration) || 0,
          releaseDate: new Date(formData.releaseDate).toISOString()
        };
        
        await updateEpisode(movieId, editingEpisode.id, episodeData);
        
        // Replace video nếu có upload file mới
        if (formData.videoFile) {
          const interval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
          }, 500);
          
          await replaceEpisodeVideo(movieId, editingEpisode.id, formData.videoFile);
          
          clearInterval(interval);
          setUploadProgress(100);
          alert('Cập nhật tập phim và video thành công!');
        } else {
          alert('Cập nhật thông tin tập phim thành công!');
        }
      } else {
        // Create new episode with video
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
        formDataToSend.append('releaseDate', new Date(formData.releaseDate).toISOString());
        formDataToSend.append('videoFile', formData.videoFile);

        const interval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        await createEpisodeWithVideo(movieId, formDataToSend);
        
        clearInterval(interval);
        setUploadProgress(100);
        
        alert('Thêm tập phim thành công!');
      }
      
      setShowModal(false);
      fetchMovieAndEpisodes();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
                Quản lý tập phim
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

      {/* Movie Info Card with Glass Effect */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <img
              src={getStaticFileUrl(movie?.posterUrl) || 'https://via.placeholder.com/200x300'}
              alt={movie?.title}
              className="w-40 h-60 object-cover rounded-2xl shadow-2xl border-2 border-white/30 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x300';
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-3">{movie?.title}</h2>
            <p className="text-purple-100 mb-6 leading-relaxed">{movie?.description}</p>
            <div className="grid grid-cols-3 gap-6">
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20">
                <p className="text-purple-200 text-sm mb-1">Năm phát hành</p>
                <p className="text-white font-bold text-xl">{movie?.releaseYear}</p>
              </div>
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20">
                <p className="text-purple-200 text-sm mb-1">Tổng số tập</p>
                <p className="text-white font-bold text-xl">{episodes.length} tập</p>
              </div>
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20">
                <p className="text-purple-200 text-sm mb-1">Đánh giá</p>
                <p className="text-white font-bold text-xl">★ {movie?.rating || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Grid */}
      {episodes.length === 0 ? (
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
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 cursor-pointer" onClick={() => openVideoModal(episode)}>
                <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/40 transition-all">
                  <Play className="w-20 h-20 text-white opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all drop-shadow-2xl" />
                </div>
                <div className="absolute top-3 left-3 backdrop-blur-lg bg-black/60 text-white px-4 py-2 rounded-xl font-bold border border-white/30 shadow-lg">
                  Tập {episode.episodeNumber}
                </div>
                {episode.duration && (
                  <div className="absolute bottom-3 right-3 backdrop-blur-lg bg-black/60 text-white px-3 py-2 rounded-xl flex items-center gap-2 border border-white/30 shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{formatDuration(episode.duration)}</span>
                  </div>
                )}
              </div>

              {/* Episode Info */}
              <div className="p-5">
                <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">
                  {episode.title}
                </h3>
                <p className="text-sm text-purple-200 mb-4 line-clamp-2">
                  {episode.description || 'Chưa có mô tả'}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-purple-300 mb-4 backdrop-blur-lg bg-white/10 px-3 py-2 rounded-xl border border-white/20 w-fit">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {episode.releaseDate
                      ? new Date(episode.releaseDate).toLocaleDateString('vi-VN')
                      : 'Chưa rõ'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openVideoModal(episode)}
                    className="flex-1 px-4 py-3 backdrop-blur-lg bg-blue-500/80 hover:bg-blue-600/90 text-white rounded-2xl transition-all flex items-center justify-center gap-2 font-semibold border border-white/30 shadow-lg hover:scale-105"
                  >
                    <Play className="w-4 h-4" />
                    Xem
                  </button>
                  <button
                    onClick={() => openEditModal(episode)}
                    className="flex-1 px-4 py-3 backdrop-blur-lg bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all flex items-center justify-center gap-2 font-semibold border border-white/30 shadow-lg hover:scale-105"
                  >
                    <Edit2 className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(episode.id, episode.title)}
                    className="flex-1 px-4 py-3 backdrop-blur-lg bg-red-500/80 hover:bg-red-600/90 text-white rounded-2xl transition-all flex items-center justify-center gap-2 font-semibold border border-white/30 shadow-lg hover:scale-105"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal with Glass Effect */}
      {showVideoModal && currentVideo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl">
            {/* Header */}
            <div className="backdrop-blur-2xl bg-slate-900/90 rounded-t-3xl px-8 py-5 flex items-center justify-between border border-white/20 border-b-0">
              <div className="flex-1 pr-4">
                <h3 className="text-2xl font-bold text-white mb-1">
                  Tập {currentVideo.episodeNumber}: {currentVideo.title}
                </h3>
                {currentVideo.description && (
                  <p className="text-sm text-purple-200 line-clamp-2">{currentVideo.description}</p>
                )}
              </div>
              <button
                onClick={closeVideoModal}
                className="flex-shrink-0 p-3 backdrop-blur-lg bg-white/10 hover:bg-red-500/80 rounded-2xl transition-all border border-white/20 hover:border-red-500/50 group"
                title="Đóng"
              >
                <X className="w-6 h-6 text-purple-200 group-hover:text-white" />
              </button>
            </div>

            {/* Video Player */}
            <div className="bg-black aspect-video border-x border-white/20">
              <video
                className="w-full h-full"
                controls
                autoPlay
                controlsList="nodownload"
                src={getStaticFileUrl(currentVideo.videoUrl)}
                onError={(e) => {
                  console.error('Video error:', e);
                  alert('Không thể tải video. Vui lòng thử lại sau.');
                }}
              >
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>

            {/* Footer Info */}
            <div className="backdrop-blur-2xl bg-slate-900/90 rounded-b-3xl px-8 py-4 flex items-center justify-between border border-white/20 border-t-0">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 backdrop-blur-lg bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                  <Clock className="w-5 h-5 text-purple-300" />
                  <span className="text-white font-semibold">{formatDuration(currentVideo.duration)}</span>
                </div>
                <div className="flex items-center gap-2 backdrop-blur-lg bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                  <Calendar className="w-5 h-5 text-purple-300" />
                  <span className="text-white font-semibold">
                    {currentVideo.releaseDate
                      ? new Date(currentVideo.releaseDate).toLocaleDateString('vi-VN')
                      : 'Chưa rõ'}
                  </span>
                </div>
              </div>
              <button
                onClick={closeVideoModal}
                className="px-6 py-3 backdrop-blur-lg bg-red-500/80 hover:bg-red-600/90 text-white rounded-2xl transition-all font-semibold border border-white/30 shadow-lg hover:scale-105"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal with Glass Effect */}
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
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20"
                disabled={uploading}
              >
                <X className="w-5 h-5 text-purple-200" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Episode Number & Title */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                    Số tập <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="episodeNumber"
                    value={formData.episodeNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                    min="1"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                    Tên tập <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                    placeholder="VD: Khởi đầu hành trình"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all resize-none"
                  placeholder="Mô tả nội dung tập phim..."
                />
              </div>

              {/* Duration & Release Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                    placeholder="45"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                    Ngày phát hành <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  File video {!editingEpisode && <span className="text-red-400">*</span>}
                </label>
                {editingEpisode && (
                  <div className="mb-3 p-4 backdrop-blur-lg bg-amber-500/20 rounded-2xl border border-amber-500/30">
                    <p className="text-sm text-amber-200 font-medium">
                      💡 <span className="font-bold">Tip:</span> Upload file mới để thay thế video hiện tại. Để trống nếu chỉ muốn sửa thông tin.
                    </p>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed border-white/30 rounded-2xl hover:border-cyan-400 cursor-pointer transition-all backdrop-blur-lg bg-white/5 hover:bg-white/10">
                  <Upload className="w-10 h-10 text-purple-300" />
                  <div className="text-center">
                    <span className="text-purple-200 font-medium block mb-1">
                      {formData.videoFile
                        ? `${formData.videoFile.name}`
                        : (editingEpisode ? 'Chọn video mới để thay thế (tùy chọn)' : 'Chọn file video để upload')}
                    </span>
                    {formData.videoFile && (
                      <span className="text-sm text-cyan-300 font-semibold">
                        {(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-purple-300">MP4, MKV, AVI - Tối đa 500MB</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    required={!editingEpisode}
                  />
                </label>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="backdrop-blur-lg bg-blue-500/20 rounded-2xl p-5 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
                      <span className="font-bold text-blue-200">
                        {uploadProgress < 100 ? 'Đang tải lên...' : 'Hoàn thành!'}
                      </span>
                    </div>
                    <span className="font-bold text-blue-200 text-lg">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-900/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  {formData.videoFile && (
                    <p className="text-xs text-blue-300 mt-3 font-medium">
                      {formData.videoFile.name} ({(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 backdrop-blur-lg bg-white/10 border-2 border-white/20 text-purple-200 rounded-2xl hover:bg-white/20 hover:border-white/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg shadow-purple-500/50 hover:shadow-xl border border-white/20 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    editingEpisode ? 'Cập nhật' : 'Thêm tập'
                  )}
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
