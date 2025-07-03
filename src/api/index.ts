// API base configuration
const API = {
    baseURL: 'http://127.0.0.1:8000',
    endpoints: {
        auth: {
            login: '/api/auth/login/',
            refresh: '/api/auth/login/refresh/',
            logout: '/api/auth/logout/'
        },
        inventory: {
            base: '/web/api/inventory/'
        },
        warehouse: {
            base: '/masterdata/api/warehouses/'
        },
        account: {
            base: '/masterdata/api/accounts/'
        }
    }
};

export default API;
