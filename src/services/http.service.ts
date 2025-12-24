import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '@config/index';
import logger from './logger.service';

class HttpService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: config.laravel.apiUrl,
            timeout: config.laravel.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('HTTP Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                logger.debug(`HTTP Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                logger.error('HTTP Response Error:', error.message);
                return Promise.reject(error);
            }
        );
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}

export default new HttpService();
