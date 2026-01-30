import apiClient from "./api";

export interface LogEntry {
    id: string;
    user_id: string;
    user?: {
        full_name: string;
        email: string;
        roles?: string[];
    };
    action: string;
    table_name: string;
    record_id: string;
    old_data: any;
    new_data: any;
    created_at: string;
}

export interface LogsResponse {
    data: LogEntry[];
    total: number;
    page: number;
    limit: number;
}

export const settingsService = {
    getSettings: async () => {
        const response = await apiClient.get("/settings");
        return response.data;
    },

    updateSettings: async (settings: any) => {
        const response = await apiClient.put("/settings", settings);
        return response.data;
    },

    getAuditLogs: async (page = 1, limit = 10, action = "", tableName = "", search = "") => {
        const response = await apiClient.get<LogsResponse>("/logs/audit", {
            params: { page, limit, action, table_name: tableName, search },
        });
        return response.data;
    },

    getSystemLogs: async (page = 1, limit = 10, action = "", search = "") => {
        const response = await apiClient.get<LogsResponse>("/logs/system", {
            params: { page, limit, action, search },
        });
        return response.data;
    },

    getSettingsStats: async () => {
        const response = await apiClient.get("/admin/settings-stats");
        return response.data;
    },

    getLogById: async (id: string, type: 'audit' | 'system') => {
        const response = await apiClient.get<LogEntry>(`/logs/${type}/${id}`);
        return response.data;
    },
};
