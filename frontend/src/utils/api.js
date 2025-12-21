import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the token
API.interceptors.request.use((req) => {
  if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      req.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return req;
});

export default API;
