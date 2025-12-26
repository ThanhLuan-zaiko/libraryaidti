import apiClient from "./api";

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

export interface AnalyticsData {
    [key: string]: string | number;
    date: string;
    articles: number;
    views: number;
}

export interface CategoryDistribution {
    [key: string]: string | number;
    name: string;
    value: number;
}

export interface DashboardData {
    stats: AdminStats;
    activities: AdminActivity[];
    analytics: AnalyticsData[];
    category_distribution: CategoryDistribution[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
    const response = await apiClient.get("/admin/dashboard");
    return response.data;
};
