import axios from 'axios'
import API from '@/api'

const IS_PROD = import.meta.env.PROD

/**
 * Instance Axios sans intercepteurs — utilisée par authService
 * pour éviter une dépendance circulaire avec axiosConfig.
 */
export const axiosBase = axios.create({
    baseURL: API.baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    withCredentials: IS_PROD,
})
