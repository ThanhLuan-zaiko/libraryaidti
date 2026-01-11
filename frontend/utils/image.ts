/**
 * Resolves a full image URL given a relative path from the backend
 * @param path The relative path (e.g., /uploads/articles/...)
 * @returns The full URL to the image on the backend server
 */
export const getImageUrl = (path?: string): string => {
    if (!path) return '';

    // If it's already an absolute URL or a data URL (base64), return as is
    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }

    // Get backend base URL from environment variable
    // NEXT_PUBLIC_API_URL is e.g. http://localhost:8080/api/v1
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');

    // Ensure path starts with a slash and remove leading slashes if base ends with one
    const cleanPath = path.replace(/^\/+/, '');

    return `${baseUrl}/${cleanPath}`;
};
