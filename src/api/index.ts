// API base configuration
const API = {
  baseURL: 'http://192.168.11.116:8000',
  endpoints: {
    auth: {
      login: '/api/auth/login/',
      refresh: '/api/auth/login/refresh/',
      logout: '/api/auth/logout/'
    },
    inventory: {
      base: '/web/api/inventory/'
    }
  }
};

export default API;