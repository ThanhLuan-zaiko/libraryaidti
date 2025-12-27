import apiClient from './api';
import { CategoryStats } from './category.service';
import { TagStats } from './tag.service';

const ANALYTICS_URL = '/admin/analytics';

export interface ArticleTrend {
    date: string;
    count: number;
}

export interface AnalyticsData {
    total_articles: number;
    total_views: number;
    total_comments: number;
    article_trend: ArticleTrend[];
    top_categories: CategoryStats[];
    top_tags: TagStats[];
}

export interface AdminStats {
    total_articles: number;
    total_readers: number;
    total_categories: number;
    pending_posts: number;
    article_trend: number;
    reader_trend: number;
}

export interface AdminActivity {
    id: string;
    type: string;
    content: string;
    timestamp: string;
    user: string;
}

export interface DashboardAnalytics {
    date: string;
    articles: number;
    views: number;
}

export interface CategoryDistribution {
    name: string;
    value: number;
}

export interface DashboardData {
    stats: AdminStats;
    activities: AdminActivity[];
    analytics: DashboardAnalytics[];
    category_distribution: CategoryDistribution[];
}

export const getDashboardData = async () => {
    const response = await apiClient.get<DashboardData>('/admin/dashboard');
    return response.data;
};

export const dashboardService = {
    async getAnalytics() {
        const response = await apiClient.get<AnalyticsData>(ANALYTICS_URL);
        return response.data;
    }
};
