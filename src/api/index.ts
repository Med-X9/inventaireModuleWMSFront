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
        ecartComptage: {
            base: '/web/api/ecarts-comptage/'
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
        /** GET statut tâche PDF (POST async → poll) — API_PDF_INVENTAIRE.md §6 */
        pdfTasks: {
            base: '/web/api/pdf-tasks/'
        },
        resource: {
            base: 'masterdata/api/ressources'
        },

        location: {
            base: '/masterdata/api/locations/'
        },
        inventoryResults: {
            base: '/web/api/inventory-results/'
        },
        ecartStock: {
            base: '/web/api/ecarts-stock/'
        },
        article: {
            base: '/mobile/api/'
        },
        countingDetail: {
            base: '/mobile/api/sync/data/'
        }
    },
};

export default API;
