import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const status = error.response?.status;
        const errorData = error.response?.data;

        // Handle Account Locked (Real-time enforcement)
        if (status === 403 && errorData?.error === "ACCOUNT_LOCKED") {
            if (typeof window !== "undefined") {
                // Dispatch a custom event to show the Lock Modal
                window.dispatchEvent(new CustomEvent("account-locked"));
            }
            return Promise.reject(error);
        }

        if (
            status === 401 &&
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
