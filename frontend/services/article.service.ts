import apiClient from './api';

const ARTICLES_URL = '/articles';

export interface Article {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    content: string;
    author_id: string;
    author?: { full_name: string; email: string };
    category_id?: string;
    category?: { name: string };
    status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
    image_url?: string;
    created_at: string;
    updated_at: string;
    published_at?: string;
    is_featured: boolean;
    view_count: number;
    images?: {
        id: string;
        image_url: string;
        is_primary?: boolean;
    }[];
}

export interface ArticleInput {
    title: string;
    content: string;
    summary?: string;
    category_id?: string;
    status: string;
    image_url?: string;
    is_featured?: boolean;
    images?: {
        image_url?: string;
        image_data?: string;
        is_primary?: boolean;
    }[];
    tags?: { id?: string; name: string; slug?: string }[];
    seo_metadata?: {
        meta_title?: string;
        meta_description?: string;
        meta_keywords?: string;
        og_image?: string;
        canonical_url?: string;
    };
    related_article_ids?: string[];
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: Pagination;
}

export const articleService = {
    async getList(params: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        category_id?: string;
        minimal?: boolean;
    }) {
        const response = await apiClient.get<PaginatedResult<Article>>(ARTICLES_URL, {
            params
        });
        return response.data;
    },

    async getById(id: string) {
        const response = await apiClient.get<Article>(`${ARTICLES_URL}/${id}`);
        return response.data;
    },

    async create(data: ArticleInput) {
        const response = await apiClient.post<Article>(ARTICLES_URL, data);
        return response.data;
    },

    async update(id: string, data: ArticleInput) {
        const response = await apiClient.put<Article>(`${ARTICLES_URL}/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await apiClient.delete<{ message: string }>(`${ARTICLES_URL}/${id}`);
        return response.data;
    },

    async changeStatus(id: string, status: string, note?: string) {
        const response = await apiClient.put<{ message: string }>(`${ARTICLES_URL}/${id}/status`, { status, note });
        return response.data;
    },

    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ url: string }>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
