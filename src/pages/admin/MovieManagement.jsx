import React, { useState, useEffect} from 'react';
import { Search, Plus, Edit2, Trash2, X, Film as FilmIcon, User, Upload, List } from 'lucide-react';
import { getMovies, deleteMovie, createMovie, updateMovie, getGenres, getCasts, getStaticFileUrl } from '../../services/api';
import { useNavigate } from "react-router-dom";

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [casts, setCasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [castSearchTerm, setCastSearchTerm] = useState('');
  const [posterPreview, setPosterPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    releaseYear: '', 
    castIds: [],
    posterFile: null,
    genreIds: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
    fetchGenres();
    fetchCasts();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await getMovies();
      setMovies(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách phim');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const data = await getGenres();
      setGenres(data);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  const fetchCasts = async () => {
    try {
      const data = await getCasts();
      setCasts(data);
    } catch (err) {
      console.error('Error fetching casts:', err);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Bạn có chắc muốn xóa phim "${title}"?`)) return;
    
    try {
      await deleteMovie(id);
      setMovies(movies.filter(m => m.id !== id));
      alert('Xóa phim thành công!');
    } catch (err) {
      alert('Không thể xóa phim: ' + err.message);
    }
  };

  const openCreateModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      releaseYear: '',
      director: '',
      castIds: [],
      posterFile: null,
      trailerUrl: '',
      genreIds: []
    });
    setPosterPreview(null);
    setCastSearchTerm('');
    setShowModal(true);
  };

  const openEditModal = (movie) => {
    console.log('Opening edit modal with movie:', movie);
    setEditingMovie(movie);
    
    const castIds = Array.isArray(movie.casts) ? movie.casts.map(c => c.id) : [];
    const genreIds = Array.isArray(movie.genres) ? movie.genres.map(g => g.id) : [];
    
    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      releaseYear: movie.releaseYear?.toString() || '',
      director: movie.director || '',
      castIds: castIds,
      posterFile: null,
      trailerUrl: movie.trailerUrl || '',
      genreIds: genreIds
    });
    setPosterPreview(getStaticFileUrl(movie.posterUrl) || null);
    setCastSearchTerm('');
    setShowModal(true);
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, posterFile: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (!editingMovie) {
        if (!formData.title || formData.title.trim() === '') {
          alert('Vui lòng nhập tên phim');
          return;
        }
        
        if (!formData.releaseYear) {
          alert('Vui lòng nhập năm phát hành');
          return;
        }
        
        if (!formData.posterFile) {
          alert('Vui lòng chọn ảnh poster');
          return;
        }
      }
      
      const movieData = {
        title: formData.title || (editingMovie ? editingMovie.title : ''),
        description: formData.description || (editingMovie ? editingMovie.description : ''),
        releaseYear: formData.releaseYear || (editingMovie ? editingMovie.releaseYear?.toString() : ''),
        posterFile: formData.posterFile,
        castIds: formData.castIds || [],
        genreIds: formData.genreIds || []
      };
      
      if (formData.director || (editingMovie && editingMovie.director)) {
        movieData.director = formData.director || editingMovie.director;
      }
      
      if (formData.trailerUrl || (editingMovie && editingMovie.trailerUrl)) {
        movieData.trailerUrl = formData.trailerUrl || editingMovie.trailerUrl;
      }
      
      console.log('Submitting movie data:', {
        ...movieData,
        posterFile: movieData.posterFile ? `File: ${movieData.posterFile.name}` : 'No file'
      });

      if (editingMovie) {
        await updateMovie(editingMovie.id, movieData);
        alert('Cập nhật phim thành công!');
      } else {
        await createMovie(movieData);
        alert('Thêm phim mới thành công!');
      }
      
      setShowModal(false);
      fetchMovies();
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenreChange = (genreId) => {
    setFormData(prev => {
      const genreIds = prev.genreIds.includes(genreId)
        ? prev.genreIds.filter(id => id !== genreId)
        : [...prev.genreIds, genreId];
      return { ...prev, genreIds };
    });
  };

  const handleCastChange = (castId) => {
    setFormData(prev => {
      const castIds = prev.castIds.includes(castId)
        ? prev.castIds.filter(id => id !== castId)
        : [...prev.castIds, castId];
      return { ...prev, castIds };
    });
  };

  const getSelectedCastsNames = () => {
    return casts
      .filter(cast => formData.castIds.includes(cast.id))
      .map(cast => cast.name)
      .join(', ');
  };

  const filteredCasts = casts.filter(cast =>
    cast.name?.toLowerCase().includes(castSearchTerm.toLowerCase())
  );

  const filteredMovies = movies.filter(movie =>
    movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.director?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <FilmIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Quản lý phim
              </h1>
              <p className="text-purple-200 mt-1 text-lg">Quản lý kho phim của hệ thống</p>
            </div>
          </div>
          <button 
            onClick={openCreateModal}
            className="group relative backdrop-blur-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/50 hover:scale-105 border border-white/20"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Thêm phim mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">Tổng số phim</p>
            <p className="text-4xl font-bold text-white mt-3 tabular-nums">{movies.length}</p>
          </div>
        </div>
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">Phim mới nhất</p>
            <p className="text-lg font-bold text-emerald-300 mt-3 truncate">
              {movies.length > 0 ? movies[movies.length - 1]?.title : 'Chưa có'}
            </p>
          </div>
        </div>
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">Thể loại</p>
            <p className="text-4xl font-bold text-purple-300 mt-3 tabular-nums">{genres.length}</p>
          </div>
        </div>
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">Diễn viên</p>
            <p className="text-4xl font-bold text-amber-300 mt-3 tabular-nums">{casts.length}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl shadow-lg">
          {error}
        </div>
      )}

      {/* Search with Glass Effect */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm phim theo tên..."
            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Movies Grid with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMovies.map((movie) => (
          <div key={movie.id} className="group backdrop-blur-xl bg-white/10 rounded-3xl overflow-hidden hover:bg-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-105 border border-white/20">
            <div className="relative aspect-[2/3] overflow-hidden">
              <img 
                src={getStaticFileUrl(movie.posterUrl) || 'https://via.placeholder.com/300x450'} 
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x450';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
              
              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex flex-col gap-3 w-full px-4">
                  <button 
                    onClick={() => navigate(`/admin/movies/${movie.id}/episodes`)}
                    className="w-full backdrop-blur-lg bg-purple-500/80 hover:bg-purple-600/90 text-white py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 border border-white/30 shadow-lg hover:scale-105"
                  >
                    <List className="w-5 h-5" />
                    Quản lý tập phim
                  </button>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => openEditModal(movie)}
                      className="flex-1 backdrop-blur-lg bg-blue-500/80 hover:bg-blue-600/90 text-white py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 border border-white/30 shadow-lg hover:scale-105"
                    >
                      <Edit2 className="w-4 h-4" />
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(movie.id, movie.title)}
                      className="flex-1 backdrop-blur-lg bg-red-500/80 hover:bg-red-600/90 text-white py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 border border-white/30 shadow-lg hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">{movie.title}</h3>
              <div className="flex items-center gap-2 text-sm text-purple-300 mb-3">
                <span className="backdrop-blur-lg bg-white/10 px-3 py-1 rounded-xl border border-white/20">
                  {movie.releaseYear || 'N/A'}
                </span>
              </div>
              <p className="text-sm text-purple-200 line-clamp-2">{movie.description}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredMovies.length === 0 && !loading && (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 text-center border border-white/20">
          <FilmIcon className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
          <p className="text-purple-200 text-lg">
            {searchTerm ? 'Không tìm thấy phim phù hợp' : 'Chưa có phim nào'}
          </p>
        </div>
      )}

      {/* Create/Edit Modal with Glass Effect */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-2xl bg-slate-900/95 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <FilmIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {editingMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20"
              >
                <X className="w-5 h-5 text-purple-200" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  Tên phim {!editingMovie && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                  placeholder="Nhập tên phim"
                  required={!editingMovie}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all resize-none"
                  placeholder="Nhập mô tả phim"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                    Năm phát hành {!editingMovie && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="number"
                    name="releaseYear"
                    value={formData.releaseYear}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                    placeholder="2024"
                    min="1900"
                    max="2100"
                    required={!editingMovie}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  Poster {!editingMovie && <span className="text-red-400">*</span>}
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-white/30 rounded-2xl hover:border-cyan-400 cursor-pointer transition-all backdrop-blur-lg bg-white/5 hover:bg-white/10">
                      <Upload className="w-6 h-6 text-purple-300" />
                      <span className="text-purple-200 font-medium">
                        {formData.posterFile ? formData.posterFile.name : (editingMovie ? 'Chọn ảnh mới (tùy chọn)' : 'Chọn ảnh poster')}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterChange}
                        className="hidden"
                        required={!editingMovie}
                      />
                    </label>
                    <p className="text-xs text-purple-300 mt-2 ml-1">
                      {editingMovie ? 'Để trống nếu không muốn thay đổi. ' : ''}JPG, PNG, tối đa 5MB
                    </p>
                  </div>
                  {posterPreview && (
                    <div className="w-32 h-48 border-2 border-white/30 rounded-2xl overflow-hidden shadow-lg">
                      <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Cast Selection */}
              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  Diễn viên {editingMovie && <span className="text-xs text-purple-300 normal-case">(để trống nếu không thay đổi)</span>}
                </label>
                
                {formData.castIds.length > 0 && (
                  <div className="mb-3 p-4 backdrop-blur-lg bg-blue-500/20 rounded-2xl border border-blue-500/30">
                    <p className="text-sm text-blue-200">
                      <span className="font-bold">Đã chọn ({formData.castIds.length}):</span> {getSelectedCastsNames()}
                    </p>
                  </div>
                )}

                <div className="relative mb-3 group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm diễn viên..."
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                    value={castSearchTerm}
                    onChange={(e) => setCastSearchTerm(e.target.value)}
                  />
                </div>

                <div className="backdrop-blur-lg bg-white/5 border-2 border-white/20 rounded-2xl max-h-60 overflow-y-auto">
                  {filteredCasts.length > 0 ? (
                    <div className="divide-y divide-white/10">
                      {filteredCasts.map(cast => (
                        <label key={cast.id} className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer transition-all group/item">
                          <input
                            type="checkbox"
                            checked={formData.castIds.includes(cast.id)}
                            onChange={() => handleCastChange(cast.id)}
                            className="w-5 h-5 text-cyan-600 rounded"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                              {cast.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover/item:text-cyan-300 transition-colors">{cast.name}</p>
                              {cast.nationality && (
                                <p className="text-xs text-purple-300">{cast.nationality}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-purple-300">
                      {castSearchTerm ? 'Không tìm thấy diễn viên' : 'Chưa có diễn viên nào'}
                    </div>
                  )}
                </div>
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  Thể loại {editingMovie && <span className="text-xs text-purple-300 normal-case">(để trống nếu không thay đổi)</span>}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {genres.map(genre => (
                    <label key={genre.id} className={`flex items-center gap-3 p-4 backdrop-blur-lg rounded-2xl cursor-pointer transition-all border-2 ${
                      formData.genreIds.includes(genre.id)
                        ? 'bg-cyan-500/20 border-cyan-500/50'
                        : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.genreIds.includes(genre.id)}
                        onChange={() => handleGenreChange(genre.id)}
                        className="w-5 h-5 text-cyan-600 rounded"
                      />
                      <span className="text-sm text-white font-medium">{genre.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 backdrop-blur-lg bg-white/10 border-2 border-white/20 text-purple-200 rounded-2xl hover:bg-white/20 hover:border-white/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all font-semibold shadow-lg shadow-emerald-500/50 hover:shadow-xl border border-white/20 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    editingMovie ? 'Cập nhật' : 'Thêm phim'
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

export default MovieManagement;
