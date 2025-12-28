import apiClient from './api';

const AUTH_URL = '/auth';

export const authService = {
    async register(data: any) {
        const response = await apiClient.post(`${AUTH_URL}/register`, data);
        return response.data;
    },

    async login(data: any) {
        const response = await apiClient.post(`${AUTH_URL}/login`, data);
        return response.data;
    },

    async logout() {
        await apiClient.post(`${AUTH_URL}/logout`);
    },

    async getMe() {
        const response = await apiClient.get(`${AUTH_URL}/me`);
        return response.data;
    },

    async updateProfile(fullName: string) {
        const response = await apiClient.put(`${AUTH_URL}/profile`, { full_name: fullName });
        return response.data;
    },

    async changePassword(data: any) {
        const response = await apiClient.put(`${AUTH_URL}/password`, data);
        return response.data;
    }
};
