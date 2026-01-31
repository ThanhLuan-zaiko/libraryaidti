/**
 * Utility function to highlight matching text in search results
 * @param text - The text to highlight matches in
 * @param query - The search query to match
 * @returns HTML string with highlighted matches
 */
export function highlightText(text: string, query: string): string {
    if (!query || !text) return text;

    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create regex to match query (case insensitive, global)
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Replace matches with highlighted version
    return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900 font-semibold px-0.5 rounded">$1</mark>');
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}
