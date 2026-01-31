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
    comment_count?: number;
    complexity?: number;
    depth?: number;
    impact?: number;
    rating_avg?: number;
    rating_count?: number;
    images?: {
        id: string;
        image_url: string;
        description?: string;
        is_primary?: boolean;
        seo_metadata?: SeoMetadata;
    }[];
    redirects?: ArticleSeoRedirect[];
    tags?: { id: string; name: string; slug: string }[];
    related_articles?: Article[];
}

export interface SeoMetadata {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
}

export interface ArticleSeoRedirect {
    id: string;
    article_id: string;
    from_slug: string;
    to_slug: string;
    created_at: string;
}

export interface ArticleInput {
    title: string;
    slug?: string;
    content: string;
    summary?: string;
    category_id?: string;
    status: string;
    image_url?: string;
    is_featured?: boolean;
    images?: {
        local_id?: string; // For frontend referencing
        image_url?: string;
        image_data?: string;
        description?: string;
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

export interface BackendResponse<T, M = any> {
    success: boolean;
    data: T;
    meta?: M;
    error?: {
        code: number;
        message: string;
    };
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
        tag_id?: string;
        is_featured?: boolean;
        minimal?: boolean;
        sort?: string;
    }, signal?: AbortSignal): Promise<PaginatedResult<Article>> {
        const response = await apiClient.get<BackendResponse<Article[], Pagination>>(ARTICLES_URL, {
            params,
            signal
        });
        return {
            data: response.data.data || [],
            meta: response.data.meta || { page: 1, limit: 10, total: 0 }
        };
    },

    async getTrending(limit: number = 10, signal?: AbortSignal): Promise<{ data: Article[] }> {
        const response = await apiClient.get<BackendResponse<Article[]>>(`${ARTICLES_URL}/trending`, {
            params: { limit },
            signal
        });
        return { data: response.data.data || [] };
    },

    async getDiscussed(limit: number = 10, signal?: AbortSignal): Promise<{ data: Article[] }> {
        const response = await apiClient.get<BackendResponse<Article[]>>(`${ARTICLES_URL}/discussed`, {
            params: { limit },
            signal
        });
        return { data: response.data.data || [] };
    },

    async getRandom(limit: number = 10, excludeIds: string[] = [], signal?: AbortSignal): Promise<{ data: Article[] }> {
        const response = await apiClient.get<BackendResponse<Article[]>>(`${ARTICLES_URL}/random`, {
            params: { limit, exclude_ids: excludeIds.join(',') },
            signal
        });
        return { data: response.data.data || [] };
    },

    async getById(id: string, signal?: AbortSignal): Promise<Article | null> {
        const response = await apiClient.get<BackendResponse<Article>>(`${ARTICLES_URL}/${id}`, { signal });
        return response.data.data || null;
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

    async updateStatus(id: string, status: Article['status'], note?: string): Promise<Article> {
        const response = await apiClient.put<Article>(`${ARTICLES_URL}/${id}/status`, { status, note });
        return response.data;
    },

    async addRedirect(id: string, fromSlug: string): Promise<void> {
        await apiClient.post(`${ARTICLES_URL}/${id}/redirects`, { from_slug: fromSlug });
    },

    async deleteRedirect(id: string, redirectId: string): Promise<void> {
        await apiClient.delete(`${ARTICLES_URL}/${id}/redirects/${redirectId}`);
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
    },

    async getRelations(id: string, signal?: AbortSignal): Promise<ArticleRelationDetail> {
        const response = await apiClient.get<BackendResponse<ArticleRelationDetail>>(`${ARTICLES_URL}/${id}/relations`, { signal });
        return response.data.data || { incoming_articles: [], outgoing_articles: [] };
    },

    async rateArticle(id: string, details: { content: number; clarity: number; relevance: number }) {
        const response = await apiClient.post(`${ARTICLES_URL}/${id}/rate`, details);
        return response.data;
    },

    async getArticleRating(id: string, signal?: AbortSignal) {
        const response = await apiClient.get<BackendResponse<{
            average: number;
            count: number;
            user_rating: { content: number; clarity: number; relevance: number } | null
        }>>(`${ARTICLES_URL}/${id}/rating`, { signal });
        return response.data.data || { average: 0, count: 0, user_rating: null };
    },

    async search(params: {
        q: string;
        page?: number;
        limit?: number;
        category_id?: string;
        status?: string;
    }, signal?: AbortSignal): Promise<{
        data: Article[];
        meta: {
            total: number;
            page: number;
            limit: number;
            query: string;
        };
    }> {
        const queryParams = {
            q: params.q,
            page: params.page || 1,
            limit: params.limit || 5,
            ...(params.category_id && { category_id: params.category_id }),
            ...(params.status && { status: params.status }),
        };

        const response = await apiClient.get<BackendResponse<Article[], {
            total: number;
            page: number;
            limit: number;
            query: string;
        }>>(`${ARTICLES_URL}/search`, {
            params: queryParams,
            signal
        });

        return {
            data: response.data.data || [],
            meta: response.data.meta || { total: 0, page: 1, limit: 5, query: params.q }
        };
    }
};

export interface ArticleRelationDetail {
    incoming_articles: {
        id: string;
        title: string;
        slug: string;
    }[];
    outgoing_articles: {
        id: string;
        title: string;
        slug: string;
    }[];
}
