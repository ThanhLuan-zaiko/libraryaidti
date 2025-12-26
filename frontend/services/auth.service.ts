import apiClient from './api';

const AUTH_URL = '/auth';

export const authService = {
    async register(data: any) {
        const response = await apiClient.post(`${AUTH_URL}/register`, data);
        return response.data;
    },

    async login(data: any) {
        const response = await apiClient.post(`${AUTH_URL}/login`, data);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async logout() {
        try {
            await apiClient.post(`${AUTH_URL}/logout`);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('user');
        }
    },

    getCurrentUser() {
        if (typeof window === 'undefined') return null;
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getAuthHeader() {
        return {};
    },

    async updateProfile(fullName: string) {
        const response = await apiClient.put(`${AUTH_URL}/profile`, { full_name: fullName });
        const user = this.getCurrentUser();
        if (user) {
            user.full_name = fullName;
            localStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
    },

    async changePassword(data: any) {
        const response = await apiClient.put(`${AUTH_URL}/password`, data);
        return response.data;
    }
};
