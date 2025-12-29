const API_BASE_URL = 'http://localhost:8080/api';
const STATIC_BASE_URL = 'https://d58vokudzsdux.cloudfront.net'; // Base URL cho static files

// Helper function để lấy full URL cho static files
export const getStaticFileUrl = (relativePath) => {
  if (!relativePath) return null;
  // Nếu đã là absolute URL, return ngay
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  // Xử lý double slashes
  const cleanPath = relativePath.replace('//', '/');
  return `${STATIC_BASE_URL}/${cleanPath}`;
};

// Helper function để lấy token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function để lấy headers cho FormData
const getFormDataHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
    // Không set Content-Type, browser tự động set cho FormData
  };
};

// Helper function để handle response
const handleResponse = async (response) => {
  // Check status trước
  if (!response.ok) {
    let errorMessage = 'Có lỗi xảy ra';
    
    // Clone response để có thể đọc body nhiều lần
    const clonedResponse = response.clone();
    
    try {
      const error = await response.json();
      console.error('API Error:', error);
      errorMessage = error.message || error.title || JSON.stringify(error);
    } catch (e) {
      try {
        const text = await clonedResponse.text();
        console.error('API Error (text):', text);
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      } catch (e2) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }
  
  // Success responses
  if (response.status === 204 || response.status === 205) {
    return { success: true };
  }
  
  // Check content-type
  const contentType = response.headers.get('content-type');
  
  // Clone response trước khi đọc
  const clonedResponse = response.clone();
  
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      console.warn('Failed to parse JSON, trying text:', e);
      try {
        const text = await clonedResponse.text();
        if (!text || text.trim() === '') {
          return { success: true };
        }
        return JSON.parse(text);
      } catch (e2) {
        console.error('Failed to parse response:', e2);
        return { success: true };
      }
    }
  }
  
  // Nếu không phải JSON, thử parse text
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: true };
    }
    
    // Thử parse JSON từ text
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Response is not JSON:', text);
      return { success: true, data: text };
    }
  } catch (e) {
    console.error('Failed to read response text:', e);
    return { success: true };
  }
};

// ===== AUTH APIs =====
export const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return handleResponse(response);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ===== USER APIs =====
export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const updateUserRole = async (userId, role) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role })
  });
  
  // Nếu API trả về 204 No Content
  if (response.status === 204) {
    return { success: true };
  }
  
  return handleResponse(response);
};

export const deleteUser = async (id) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  // Nếu API trả về 204 No Content
  if (response.status === 204) {
    return { success: true };
  }
  
  return handleResponse(response);
};

// ===== MOVIE APIs =====
export const getMovies = async () => {
  const response = await fetch(`${API_BASE_URL}/Movies`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getMovieById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/Movies/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getViewsByMovieId = async (movieId) => {
  const response = await fetch(`${API_BASE_URL}/history/movie/${movieId}/views`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const createMovie = async (movieData) => {
  console.log('Creating movie with data:', movieData);
  
  // Validate required fields
  if (!movieData.title) {
    throw new Error('Title is required');
  }
  
  if (!movieData.releaseYear) {
    throw new Error('Release year is required');
  }
  
  if (!movieData.posterFile) {
    throw new Error('Poster file is required');
  }
  
  const formData = new FormData();
  
  // Required fields
  formData.append('title', movieData.title);
  
  const year = parseInt(movieData.releaseYear);
  if (!isNaN(year) && year >= 1900 && year <= 2100) {
    formData.append('releaseYear', year.toString());
  } else {
    throw new Error('Invalid release year');
  }
  
  // Poster file - REQUIRED
  formData.append('PosterURL', movieData.posterFile);
  
  // Optional fields
  if (movieData.description) {
    formData.append('description', movieData.description);
  }
  
  if (movieData.director) {
    formData.append('director', movieData.director);
  }
  
  if (movieData.castIds && movieData.castIds.length > 0) {
    movieData.castIds.forEach(castId => {
      formData.append('CastIds', castId.toString());
    });
  }
  
  if (movieData.genreIds && movieData.genreIds.length > 0) {
    movieData.genreIds.forEach(genreId => {
      formData.append('GenreIds', genreId.toString());
    });
  }
  
  // Debug log
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
    } else {
      console.log(`${key}:`, value);
    }
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/Movies`, {
      method: 'POST',
      headers: getFormDataHeaders(),
      body: formData
    });
    
    console.log('Create response status:', response.status);
    return await handleResponse(response);
  } catch (error) {
    console.error('Create movie error:', error);
    throw error;
  }
};

export const updateMovie = async (id, movieData) => {
  console.log('Updating movie with data:', movieData);
  
  const formData = new FormData();
  
  if (movieData.title) {
    formData.append('title', movieData.title);
  }
  
  if (movieData.description) {
    formData.append('description', movieData.description);
  }
  
  if (movieData.releaseYear) {
    const year = parseInt(movieData.releaseYear);
    if (!isNaN(year) && year >= 1900 && year <= 2100) {
      formData.append('releaseYear', year.toString());
    }
  }
  
  if (movieData.posterFile) {
    formData.append('PosterURL', movieData.posterFile);
  }
  
  if (movieData.director) {
    formData.append('director', movieData.director);
  }
  
  if (movieData.castIds && movieData.castIds.length > 0) {
    movieData.castIds.forEach(castId => {
      formData.append('CastIds', castId.toString());
    });
  }
  
  if (movieData.genreIds && movieData.genreIds.length > 0) {
    movieData.genreIds.forEach(genreId => {
      formData.append('GenreIds', genreId.toString());
    });
  }
  
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/Movies/${id}`, {
      method: 'PUT',
      headers: getFormDataHeaders(),
      body: formData
    });
    
    console.log('Update response status:', response.status);
    console.log('Update response headers:', response.headers);
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Update movie error:', error);
    throw error;
  }
};

export const deleteMovie = async (id) => {
  const response = await fetch(`${API_BASE_URL}/Movies/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// ===== EPISODE APIs =====
export const getEpisodes = async (movieId) => {
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/Episodes`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const createEpisodeWithVideo = async (movieId, formData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/Episodes`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
      // Không set Content-Type cho FormData, browser sẽ tự set
    },
    body: formData
  });
  return handleResponse(response);
};

export const updateEpisode = async (movieId, episodeId, episodeData) => {
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/Episodes/${episodeId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(episodeData)
  });
  return handleResponse(response);
};

export const deleteEpisode = async (movieId, episodeId) => {
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/Episodes/${episodeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const replaceEpisodeVideo = async (movieId, episodeId, videoFile) => {
  const formData = new FormData();
  formData.append('videoFile', videoFile);
  
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/Episodes/${episodeId}/video`, {
    method: 'PUT',
    headers: getFormDataHeaders(),
    body: formData
  });
  return handleResponse(response);
};

export const TogglePremium = async (movieId, episodeId, isPremium) => {
  const response = await fetch(`${API_BASE_URL}/movies/${movieId}/episodes/${episodeId}/premium`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: isPremium
  });
  return handleResponse(response);
};

// ===== GENRE APIs =====
export const getGenres = async () => {
  const response = await fetch(`${API_BASE_URL}/Genres`, {
    headers: getAuthHeaders()
  });

  return handleResponse(response);
};

export const createGenre = async (genreData) => {
  const response = await fetch(`${API_BASE_URL}/Genres`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(genreData)
  });
  return handleResponse(response);
};

export const deleteGenre = async (id) => {
  const response = await fetch(`${API_BASE_URL}/Genres/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// ===== CAST/ACTOR APIs =====
export const getCasts = async () => {
  const response = await fetch(`${API_BASE_URL}/Casts`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const createCast = async (castData) => {
  const response = await fetch(`${API_BASE_URL}/Casts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(castData)
  });
  return handleResponse(response);
};

export const updateCast = async (id, castData) => {
  const response = await fetch(`${API_BASE_URL}/Casts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(castData)
  });
  return handleResponse(response);
};

export const deleteCast = async (id) => {
  const response = await fetch(`${API_BASE_URL}/Casts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// ===== STATISTICS APIs =====
export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/overview`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getPopularMovies = async (limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/popular-movies?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getTopRatedMovies = async (limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/top-rated-movies?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getGenreDistribution = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/genre-distribution`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getUserActivity = async (days = 30) => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/user-activity?days=${days}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getReviewsSummary = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/reviews-summary`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getNewUsers = async (days = 30) => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/new-users?days=${days}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getGenrePopularity = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/genre-popularity`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getActiveUsers = async (limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/active-users?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getMonthlySummary = async (months = 12) => {
  const response = await fetch(`${API_BASE_URL}/admin/stats/monthly-summary?months=${months}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// ===== RATING/REVIEW APIs =====
export const getRatings = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.rating) params.append('rating', filters.rating);
  if (filters.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/Ratings${queryString ? `?${queryString}` : ''}`;
  
  console.log('Calling getRatings:', url);
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// New Reviews API endpoints
export const getAllReviews = async () => {
  const url = `${API_BASE_URL}/reviews`;
  console.log('Calling getAllReviews:', url);
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getReviewsByMovie = async (movieId) => {
  const response = await fetch(`${API_BASE_URL}/reviews/movie/${movieId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getReviewsByRating = async (rating) => {
  const url = `${API_BASE_URL}/reviews/rating/${rating}`;
  console.log('Calling getReviewsByRating:', url);
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getReviewById = async (reviewId) => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const createReview = async (reviewData) => {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(reviewData)
  });
  return handleResponse(response);
};

export const updateReview = async (reviewId, reviewData) => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(reviewData)
  });
  return handleResponse(response);
};

export const deleteReview = async (reviewId) => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};


