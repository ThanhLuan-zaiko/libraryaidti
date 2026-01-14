import apiClient from './api';
import { User } from '@/types/user';

export interface Comment {
    id: string;
    article_id: string;
    user_id: string;
    content: string;
    parent_id?: string;
    is_spam: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    user?: User;
    replies?: Comment[];
}

export interface CommentListResponse {
    data: Comment[];
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}

export interface CreateCommentDto {
    article_id: string;
    content: string;
    parent_id?: string;
}

export const commentService = {
    async getComments(articleId: string, page = 1, limit = 10): Promise<CommentListResponse> {
        const res = await apiClient.get<CommentListResponse>(`/articles/${articleId}/comments`, {
            params: { page, limit }
        });
        return res.data;
    },

    async create(data: CreateCommentDto): Promise<Comment> {
        const res = await apiClient.post<Comment>('/comments', data);
        return res.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/comments/${id}`);
    },

    async restore(id: string): Promise<void> {
        await apiClient.put(`/comments/${id}/restore`);
    }
};
