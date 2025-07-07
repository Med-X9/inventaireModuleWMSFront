// API base configuration
const API = {
  baseURL: 'http://44.212.20.168',
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