import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Shield, User as UserIcon, Crown, Unlock } from 'lucide-react';
import { getUsers, deleteUser, updateUserRole} from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách người dùng');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${username}"?`)) return;
    
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      alert('Xóa người dùng thành công!');
    } catch (err) {
      alert('Không thể xóa người dùng: ' + err.message);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role || 'User');
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUserRole(selectedUser.id, newRole);
      
      // Cập nhật local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));
      
      alert('Cập nhật quyền thành công!');
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      alert('Không thể cập nhật quyền: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      Admin: { bg: 'bg-red-100', text: 'text-red-700', icon: Shield },
      User: { bg: 'bg-blue-100', text: 'text-blue-700', icon: UserIcon },
    };
    
    const config = roleConfig[role] || roleConfig.User;
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {role || 'User'}
      </span>
    );
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Quản lý người dùng
              </h1>
              <p className="text-purple-200 mt-1 text-lg">Quản lý thông tin và quyền hạn người dùng</p>
            </div>
          </div>
          <button className="group relative backdrop-blur-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 border border-white/20">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Thêm người dùng</span>
          </button>
        </div>
      </div>

      {/* Stats Cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">Tổng người dùng</p>
            <p className="text-4xl font-bold text-white mt-3 tabular-nums">{users.length}</p>
          </div>
        </div>
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">Admin</p>
            <p className="text-4xl font-bold text-red-300 mt-3 tabular-nums">
              {users.filter(u => u.role === 'Admin').length}
            </p>
          </div>
        </div>
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">User</p>
            <p className="text-4xl font-bold text-cyan-300 mt-3 tabular-nums">
              {users.filter(u => u.role !== 'Admin').length}
            </p>
          </div>
        </div>
        <div className="group backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm text-purple-200 font-medium uppercase tracking-wider">Premium</p>
            <p className="text-4xl font-bold text-amber-300 mt-3 tabular-nums">
              {users.filter(u => u.isPremium).length}
            </p>
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
            placeholder="Tìm kiếm theo tên, email, username..."
            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table with Glass Effect */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">ID</th>
                <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Người dùng</th>
                <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Email</th>
                <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Username</th>
                <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Quyền</th>
                <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Premium</th>
                <th className="text-left py-5 px-8 text-sm font-bold text-purple-200 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/10 transition-all duration-200 group">
                  <td className="py-5 px-8">
                    <span className="text-purple-300 font-medium tabular-nums">{user.id}</span>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
                        {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{user.name || user.username}</p>
                        {user.name && user.username && (
                          <p className="text-sm text-purple-300">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <span className="text-purple-200">{user.email}</span>
                  </td>
                  <td className="py-5 px-8">
                    <span className="text-purple-200">{user.username}</span>
                  </td>
                  <td className="py-5 px-8">
                    {user.role === 'Admin' ? (
                      <span className="inline-flex items-center gap-2 backdrop-blur-lg bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30 shadow-lg">
                        <Shield className="w-4 h-4 text-red-300" />
                        <span className="text-red-200 font-semibold">{user.role}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 backdrop-blur-lg bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 shadow-lg">
                        <UserIcon className="w-4 h-4 text-blue-300" />
                        <span className="text-blue-200 font-semibold">{user.role || 'User'}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-5 px-8">
                    {user.isPremium ? (
                      <span className="inline-flex items-center gap-2 backdrop-blur-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-2 rounded-xl border border-amber-500/30 shadow-lg shadow-amber-500/20">
                        <Crown className="w-4 h-4 text-amber-300" />
                        <span className="text-amber-200 font-semibold">Premium</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 backdrop-blur-lg bg-gray-500/20 px-4 py-2 rounded-xl border border-gray-500/30">
                        <span className="text-gray-300 font-semibold">Free</span>
                      </span>
                    )}
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openRoleModal(user)}
                        className="p-3 backdrop-blur-lg bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-300 hover:text-blue-200 transition-all border border-blue-500/30 hover:shadow-lg hover:scale-110"
                        title="Chỉnh sửa quyền"
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id, user.username || user.name)}
                        className="p-3 backdrop-blur-lg bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 hover:text-red-200 transition-all border border-red-500/30 hover:shadow-lg hover:scale-110"
                        title="Xóa người dùng"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 text-center border border-white/20">
          <UserIcon className="w-16 h-16 text-purple-300/50 mx-auto mb-4" />
          <p className="text-purple-200 text-lg">
            {searchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
          </p>
        </div>
      )}

      {/* Role Edit Modal with Glass Effect */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-2xl bg-slate-900/90 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
            {/* Modal Header */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Chỉnh sửa quyền</h3>
                </div>
                <button 
                  onClick={() => setShowRoleModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20"
                >
                  <X className="w-5 h-5 text-purple-200" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/50">
                    {selectedUser.name?.charAt(0)?.toUpperCase() || selectedUser.username?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">{selectedUser.name || selectedUser.username}</p>
                    <p className="text-sm text-purple-300">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">
                  Chọn quyền
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-5 backdrop-blur-lg rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                    newRole === 'User' 
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="User"
                      checked={newRole === 'User'}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">User</p>
                      <p className="text-sm text-purple-300">Quyền người dùng thông thường</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-5 backdrop-blur-lg rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                    newRole === 'Admin' 
                      ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="Admin"
                      checked={newRole === 'Admin'}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-5 h-5 text-red-600"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">Admin</p>
                      <p className="text-sm text-purple-300">Quyền quản trị viên - Toàn quyền truy cập</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Warning */}
              {newRole === 'Admin' && (
                <div className="backdrop-blur-lg bg-amber-500/20 border-2 border-amber-500/30 rounded-2xl p-4">
                  <p className="text-sm text-amber-200 font-medium">
                    ⚠️ Cảnh báo: Quyền Admin có toàn quyền truy cập hệ thống. Chỉ cấp cho người đáng tin cậy.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-6 py-3 backdrop-blur-lg bg-white/10 border-2 border-white/20 text-purple-200 rounded-2xl hover:bg-white/20 hover:border-white/30 transition-all font-semibold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateRole}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl border border-white/20"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
