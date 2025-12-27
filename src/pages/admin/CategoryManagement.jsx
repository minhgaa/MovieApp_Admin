import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Film, User, X } from 'lucide-react';
import { getGenres, createGenre, deleteGenre, getCasts, createCast, updateCast, deleteCast, getStaticFileUrl, getMovies } from '../../services/api';

const CategoryManagement = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'genre' hoặc 'cast'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    } else {
      fetchActors();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [genresData, moviesData] = await Promise.all([
        getGenres(),
        getMovies()
      ]);
      
      // Calculate movie count for each genre
      const genresWithCount = genresData.map(genre => {
        const movieCount = moviesData.filter(movie => 
          movie.genres && movie.genres.some(g => g.id === genre.id)
        ).length;
        
        return {
          ...genre,
          movieCount
        };
      });
      
      setCategories(genresWithCount);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách thể loại');
      console.error('Error fetching genres:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActors = async () => {
    try {
      setLoading(true);
      const data = await getCasts();
      setActors(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách diễn viên');
      console.error('Error fetching casts:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    setFormData({
      name: '',
      nationality: '',
      avatarUrl: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item, type) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      nationality: item.nationality || '',
      avatarUrl: item.avatarUrl || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'genre') {
        const genreData = {
          name: formData.name
        };
        
        if (editingItem) {
          // Update not supported in current API, skip for now
          alert('Chức năng cập nhật thể loại đang phát triển');
        } else {
          await createGenre(genreData);
          alert('Thêm thể loại thành công!');
          fetchCategories();
        }
      } else {
        const castData = {
          name: formData.name,
          avatarUrl: formData.avatarUrl
        };
        
        if (editingItem) {
          await updateCast(editingItem.id, castData);
          alert('Cập nhật diễn viên thành công!');
        } else {
          await createCast(castData);
          alert('Thêm diễn viên thành công!');
        }
        fetchActors();
      }
      
      setShowModal(false);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteGenre = async (id, name) => {
    if (!confirm(`Bạn có chắc muốn xóa thể loại "${name}"?`)) return;
    
    try {
      await deleteGenre(id);
      setCategories(categories.filter(c => c.id !== id));
      alert('Xóa thể loại thành công!');
    } catch (err) {
      alert('Không thể xóa thể loại: ' + err.message);
    }
  };

  const handleDeleteCast = async (id, name) => {
    if (!confirm(`Bạn có chắc muốn xóa diễn viên "${name}"?`)) return;
    
    try {
      await deleteCast(id);
      setActors(actors.filter(a => a.id !== id));
      alert('Xóa diễn viên thành công!');
    } catch (err) {
      alert('Không thể xóa diễn viên: ' + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 space-y-6">
      {/* Header with Glass Effect */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/50">
            <Film className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Quản lý thể loại & Diễn viên
            </h1>
            <p className="text-purple-200 mt-1 text-lg">Quản lý danh mục và diễn viên</p>
          </div>
        </div>
      </div>

      {/* Tabs with Glass Effect */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
        <div className="border-b border-white/10">
          <div className="flex">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-5 px-6 font-semibold transition-all duration-300 ${
                activeTab === 'categories'
                  ? 'bg-white/20 backdrop-blur-lg text-white border-b-4 border-cyan-400'
                  : 'text-purple-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Film className="w-6 h-6" />
                <span className="text-lg">Thể loại phim</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('actors')}
              className={`flex-1 py-5 px-6 font-semibold transition-all duration-300 ${
                activeTab === 'actors'
                  ? 'bg-white/20 backdrop-blur-lg text-white border-b-4 border-cyan-400'
                  : 'text-purple-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <User className="w-6 h-6" />
                <span className="text-lg">Diễn viên</span>
              </div>
            </button>
          </div>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="p-8">
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => openCreateModal('genre')}
                className="backdrop-blur-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:scale-105 border border-white/20 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Thêm thể loại
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto"></div>
                <p className="mt-6 text-white text-lg font-medium">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl shadow-lg">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                          <Film className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={() => openEditModal(category, 'genre')}
                            className="p-2.5 backdrop-blur-lg bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-300 hover:text-blue-200 transition-all border border-blue-500/30"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteGenre(category.id, category.name)}
                            className="p-2.5 backdrop-blur-lg bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 hover:text-red-200 transition-all border border-red-500/30"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="backdrop-blur-lg bg-cyan-500/20 px-4 py-2 rounded-xl border border-cyan-500/30">
                          <span className="text-cyan-300 font-semibold text-lg">{category.movieCount || 0}</span>
                          <span className="text-cyan-200 text-sm ml-1">phim</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {categories.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <Film className="w-20 h-20 text-purple-300/50 mx-auto mb-4" />
                <p className="text-purple-200 text-lg">Chưa có thể loại nào</p>
              </div>
            )}
          </div>
        )}

        {/* Actors Tab */}
        {activeTab === 'actors' && (
          <div className="p-8">
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => openCreateModal('cast')}
                className="backdrop-blur-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:scale-105 border border-white/20 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Thêm diễn viên
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto"></div>
                <p className="mt-6 text-white text-lg font-medium">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl shadow-lg">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {actors.map((actor) => (
                  <div key={actor.id} className="group backdrop-blur-xl bg-white/10 rounded-3xl overflow-hidden border border-white/20 hover:bg-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                    <div className="aspect-square bg-gradient-to-br from-purple-500/30 to-pink-500/30 relative overflow-hidden">
                      {actor.avatarUrl ? (
                        <img 
                          src={getStaticFileUrl(actor.avatarUrl)} 
                          alt={actor.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center">
                                <div class="text-6xl font-bold text-white">
                                  ${actor.name.charAt(0)}
                                </div>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-6xl font-bold text-white">
                            {actor.name.charAt(0)}
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => openEditModal(actor, 'cast')}
                          className="p-2.5 backdrop-blur-lg bg-blue-500/80 hover:bg-blue-600/90 rounded-xl text-white transition-all border border-white/30 shadow-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCast(actor.id, actor.name)}
                          className="p-2.5 backdrop-blur-lg bg-red-500/80 hover:bg-red-600/90 rounded-xl text-white transition-all border border-white/30 shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-5 backdrop-blur-lg bg-white/5">
                      <h3 className="font-bold text-white text-lg mb-1 truncate">{actor.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {actors.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <User className="w-20 h-20 text-purple-300/50 mx-auto mb-4" />
                <p className="text-purple-200 text-lg">Chưa có diễn viên nào</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal with Glass Effect */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-2xl bg-slate-900/95 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                    modalType === 'genre' ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500'
                  } flex items-center justify-center shadow-lg`}>
                    {modalType === 'genre' ? <Film className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {editingItem 
                      ? (modalType === 'genre' ? 'Chỉnh sửa thể loại' : 'Chỉnh sửa diễn viên')
                      : (modalType === 'genre' ? 'Thêm thể loại mới' : 'Thêm diễn viên mới')
                    }
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20"
                >
                  <X className="w-5 h-5 text-purple-200" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  {modalType === 'genre' ? 'Tên thể loại' : 'Tên diễn viên'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                  placeholder={modalType === 'genre' ? 'VD: Hành động' : 'VD: Tom Cruise'}
                  required
                />
              </div>

              {modalType === 'cast' && (
                <>
                  
                  <div>
                    <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      name="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 backdrop-blur-lg bg-white/10 border-2 border-white/20 text-purple-200 rounded-2xl hover:bg-white/20 hover:border-white/30 transition-all font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 bg-gradient-to-r ${
                    modalType === 'genre' ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500'
                  } text-white rounded-2xl hover:shadow-xl transition-all font-semibold shadow-lg border border-white/20`}
                >
                  {editingItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
