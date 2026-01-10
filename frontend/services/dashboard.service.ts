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
    total_categories: number;
    total_readers: number;
    article_trend: ArticleTrend[];
    top_categories: CategoryStats[];
    top_tags: TagStats[];
}

export interface AdminStats {
    total_articles: number;
    total_readers: number;
    total_categories: number;
    pending_posts: number;
    draft_posts: number;
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

export interface ArticleRelationStats {
    top_incoming_links: {
        article_id: string;
        article_title: string;
        incoming_count: number;
    }[];
    top_outgoing_links: {
        article_id: string;
        article_title: string;
        outgoing_count: number;
    }[];
    category_relations: {
        category_name: string;
        relation_count: number;
    }[];
    bidirectional_stats: {
        total_links: number;
        bidirectional_links: number;
        bidirectional_ratio: number;
    };
}

export interface AdvancedAnalyticsData {
    seo_stats: {
        missing_meta_description: number;
        missing_og_image: number;
        total_seo_records: number;
    };
    workflow_stats: {
        status: string;
        avg_days: number;
    }[];
    media_stats: {
        total_files: number;
        total_size: number;
    };
    versioning_stats: {
        avg_edits_per_article: number;
        total_versions: number;
    };
    content_graph: {
        total_relations: number;
        orphan_pages: number;
        avg_links_per_article: number;
    };
    content_health: {
        avg_tag_density: number;
        good_content_length: number;
    };
    relation_stats: ArticleRelationStats;
}

export const getDashboardData = async () => {
    const response = await apiClient.get<DashboardData>('/admin/dashboard');
    return response.data;
};

export const dashboardService = {
    async getAnalytics() {
        const response = await apiClient.get<AnalyticsData>(ANALYTICS_URL);
        return response.data;
    },

    async getAdvancedAnalytics() {
        const response = await apiClient.get<AdvancedAnalyticsData>('/admin/advanced-analytics');
        return response.data;
    },

    async getHierarchyStats() {
        const response = await apiClient.get<CategoryHierarchyStats>(`${ANALYTICS_URL}/hierarchy/stats`);
        return response.data;
    },

    async getCategoryTree() {
        const response = await apiClient.get<CategoryTreeData>(`${ANALYTICS_URL}/hierarchy/tree`);
        return response.data;
    },

    async getSuperDashboard() {
        const response = await apiClient.get<SuperDashboardData>('/admin/super-dashboard');
        return response.data;
    },

    async exportReport() {
        const response = await apiClient.get('/admin/export-dashboard', { responseType: 'blob' });
        return response.data;
    }
};

// Hierarchy-specific types
export interface CategoryHierarchyStats {
    root_count: number;
    child_count: number;
    avg_children: number;
    max_depth: number;
}

export interface CategoryNode {
    id: string;
    name: string;
    slug: string;
    article_count: number;
    level: number;
    children?: CategoryNode[];
}

export interface CategoryTreeData {
    roots: CategoryNode[];
}

// New Dashboard Types
export interface RoleCount {
    role_name: string;
    count: number;
}

export interface UserStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    role_distribution: RoleCount[];
}

export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    table_name: string;
    record_id: string;
    created_at: string;
}

export interface EngagementStats {
    total_comments: number;
    spam_comments: number;
    deleted_comments: number;
    total_shares: number;
    featured_count: number;
}

export interface SystemAnalytics {
    recent_audit_logs: AuditLog[];
    total_logs: number;
}

export interface SuperDashboardData {
    stats: AnalyticsData;
    advanced: AdvancedAnalyticsData;
    user_stats: UserStats;
    category_tree: CategoryNode[];
    category_hierarchy: CategoryHierarchyStats;
    engagement: EngagementStats;
    system: SystemAnalytics;
    pulse: SystemPulse;
    heatmap: ActivityHeatmap[];
    velocity: EditorialSpeed;
}

export interface SystemPulse {
    cpu_usage: number;
    memory_usage: number; // in bytes
    goroutines: number;
    db_connections: number;
    uptime_seconds: number;
    last_restart: string;
}

export interface ActivityHeatmap {
    day: string;
    hour: number;
    hits: number;
}

export interface EditorialSpeed {
    draft_to_publish_days: number;
    total_published: number;
}
