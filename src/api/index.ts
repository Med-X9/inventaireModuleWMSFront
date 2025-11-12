import axiosInstance from '@/utils/axiosConfig';

// API base configuration
const API = {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    get axiosInstance() {
        return axiosInstance;
    },
    endpoints: {
        auth: {
            login: '/api/auth/login/',
            refresh: '/api/auth/login/refresh/',
            logout: '/api/auth/logout/',
            verify: '/api/auth/verify/',
            session:'/api/auth/mobile-users/'
        },
        inventory: {
            base: '/web/api/inventory/'
        },
        warehouse: {
            base: '/masterdata/api/warehouses/'
        },
        usersmobile: {
            base: '/masterdata/api/users/mobile/'
        },
        account: {
            base: '/masterdata/api/accounts/'
        },
        job: {
            base: '/web/api/jobs/'
        },
        resource: {
            base: 'masterdata/api/ressources'
        },

        location: {
            base: '/masterdata/api/locations/'
        },
        inventoryResults: {
            base: '/web/api/inventory-results/'
        }
    },
};

export default API;
