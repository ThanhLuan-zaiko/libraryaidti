import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Response interceptor for session expiration
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (
            error.response?.status === 401 &&
            !error.config.url?.includes("/auth/login") &&
            !error.config.url?.includes("/auth/me")
        ) {
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
