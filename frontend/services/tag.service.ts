import apiClient from './api';

const TAGS_URL = '/tags';

export interface Tag {
    id: string;
    name: string;
    slug: string;
}

export interface TagStats {
    id: string;
    name: string;
    slug: string;
    usage_count: number;
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

export const tagService = {
    async getAll() {
        const response = await apiClient.get<Tag[]>(TAGS_URL);
        return response.data;
    },

    async getList(params: { page: number; limit: number; search?: string; sort?: string; order?: string }) {
        const response = await apiClient.get<PaginatedResult<Tag>>(TAGS_URL, {
            params: {
                page: params.page,
                limit: params.limit,
                q: params.search,
                sort: params.sort,
                order: params.order
            }
        });
        return response.data;
    },

    async getStats() {
        const response = await apiClient.get<TagStats[]>(`${TAGS_URL}/stats`);
        return response.data;
    },

    async getById(id: string) {
        const response = await apiClient.get<Tag>(`${TAGS_URL}/${id}`);
        return response.data;
    },

    async create(data: Partial<Tag>) {
        const response = await apiClient.post<Tag>(TAGS_URL, data);
        return response.data;
    },

    async update(id: string, data: Partial<Tag>) {
        const response = await apiClient.put<Tag>(`${TAGS_URL}/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await apiClient.delete(`${TAGS_URL}/${id}`);
        return response.data;
    }
};
