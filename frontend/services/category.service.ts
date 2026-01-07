import apiClient from './api';

const CATEGORIES_URL = '/categories';

export interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    parent?: Category;
    children?: Category[];
    level?: number; // For UI rendering purposes
}

export interface CategoryStats {
    id: string;
    name: string;
    article_count: number;
}

export interface Pagination {
    page: number;
    limit: number;
    total_rows: number;
    total_pages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: Pagination;
}

export const categoryService = {
    async getAll() {
        const response = await apiClient.get<Category[]>(CATEGORIES_URL);
        return response.data;
    },

    async getList(params: { page: number; limit: number; search?: string; sort?: string; order?: string; minimal?: boolean }) {
        const response = await apiClient.get<PaginatedResult<Category>>(CATEGORIES_URL, { params: { ...params, q: params.search } });
        return response.data;
    },

    async getStats() {
        const response = await apiClient.get<CategoryStats[]>(`${CATEGORIES_URL}/stats`);
        return response.data;
    },

    async getById(id: string) {
        const response = await apiClient.get<Category>(`${CATEGORIES_URL}/${id}`);
        return response.data;
    },

    async create(data: Partial<Category>) {
        const response = await apiClient.post<Category>(CATEGORIES_URL, data);
        return response.data;
    },

    async update(id: string, data: Partial<Category>) {
        const response = await apiClient.put<Category>(`${CATEGORIES_URL}/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await apiClient.delete(`${CATEGORIES_URL}/${id}`);
        return response.data;
    }
};
