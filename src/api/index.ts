// API base configuration
const API = {
    baseURL: 'http://192.168.11.194:8000',
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
