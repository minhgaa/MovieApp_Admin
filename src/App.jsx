import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import MovieManagement from './pages/admin/MovieManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import RatingManagement from './pages/admin/RatingManagement';
import Reports from './pages/admin/Reports';
import EpisodeManagement from './pages/admin/EpisodeManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="movies" element={<MovieManagement />} />
          <Route path="movies/:movieId/episodes" element={<EpisodeManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="ratings" element={<RatingManagement />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
