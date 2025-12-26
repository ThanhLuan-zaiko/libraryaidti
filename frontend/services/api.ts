import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Response interceptor for silent refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and it's not a retry and not a login/refresh request
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/login") &&
            !originalRequest.url?.includes("/auth/refresh")
        ) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear user data and potentially redirect to login
                console.error("Token refresh failed:", refreshError);
                localStorage.removeItem("user");
                if (typeof window !== "undefined") {
                    window.location.href = "/";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
