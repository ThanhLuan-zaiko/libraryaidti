import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HiX, HiPlus, HiChevronDown } from 'react-icons/hi';
import { Article, articleService } from '@/services/article.service';

interface RelatedArticleSelectorProps {
    selectedArticleIds: string[];
    onRelatedArticlesChange: (ids: string[]) => void;
    currentArticleId?: string;
}

// Simple debounce helper
// Stable debounce hook
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    }, [delay]);
}

const RelatedArticleSelector: React.FC<RelatedArticleSelectorProps> = ({
    selectedArticleIds,
    onRelatedArticlesChange,
    currentArticleId
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch details for already selected articles
    useEffect(() => {
        const fetchSelectedDetails = async () => {
            // Deduplicate IDs from parent
            const uniqueIds = Array.from(new Set(selectedArticleIds));

            if (uniqueIds.length === 0) {
                setSelectedArticles([]);
                return;
            }

            // If we already have some in state, only fetch missing ones
            const existingIds = selectedArticles.map(a => a.id);
            const missingIds = uniqueIds.filter(id => !existingIds.includes(id));

            if (missingIds.length === 0) {
                // If we have extra in state (removed by parent), filter state
                if (selectedArticles.length !== uniqueIds.length) {
                    setSelectedArticles(prev => prev.filter(a => uniqueIds.includes(a.id)));
                }
                return;
            }

            try {
                // Fetch each missing article. In a real app, you might want a batch API
                const details = await Promise.all(
                    missingIds.map(id => articleService.getById(id))
                );

                setSelectedArticles(prev => {
                    const combined = [...prev.filter(a => uniqueIds.includes(a.id)), ...details];
                    // Final safety deduplication by ID
                    const seen = new Set();
                    return combined.filter(a => {
                        if (seen.has(a.id)) return false;
                        seen.add(a.id);
                        return true;
                    });
                });
            } catch (error) {
                console.error("Failed to fetch selected article details", error);
            }
        };
        fetchSelectedDetails();
    }, [selectedArticleIds]);

    const fetchArticles = async (search: string, pageNum: number, append: boolean = false) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const result = await articleService.getList({
                page: pageNum,
                limit: 10,
                search: search,
                minimal: true
            });

            // Filter out current article and already selected ones
            const newArticles = result.data.filter(
                a => a.id !== currentArticleId && !selectedArticleIds.includes(a.id)
            );

            if (append) {
                setFilteredArticles(prev => [...prev, ...newArticles]);
            } else {
                setFilteredArticles(newArticles);
            }

            setHasMore(result.data.length === 10);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch articles", error);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedSearch = useDebounce((search: string) => {
        fetchArticles(search, 1, false);
    }, 300);

    // Initial search or search on input change
    useEffect(() => {
        if (showSuggestions) {
            debouncedSearch(inputValue);
        }
    }, [inputValue, showSuggestions, debouncedSearch]);

    const handleAddArticle = (article: Article) => {
        if (!selectedArticleIds.includes(article.id)) {
            onRelatedArticlesChange([...selectedArticleIds, article.id]);
            setSelectedArticles(prev => [...prev, article]);
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    const handleRemoveArticle = (id: string) => {
        onRelatedArticlesChange(selectedArticleIds.filter(aid => aid !== id));
        setSelectedArticles(prev => prev.filter(a => a.id !== id));
    };

    const handleShowAll = () => {
        setInputValue('');
        setShowSuggestions(true);
        inputRef.current?.focus();
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!hasMore || isLoading) return;

        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            fetchArticles(inputValue, page + 1, true);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setShowSuggestions(false);
                }
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSuggestions]);

    return (
        <div className="space-y-3">
            {/* Selected Articles */}
            {selectedArticles.length > 0 && (
                <div className="space-y-2">
                    {selectedArticles.map(article => (
                        <div
                            key={article.id}
                            className="flex items-center justify-between bg-gray-50 border border-gray-100 p-2 rounded-lg group hover:border-blue-200 transition-colors"
                        >
                            <span className="text-sm text-gray-700 truncate mr-2 font-medium">{article.title}</span>
                            <button
                                onClick={() => handleRemoveArticle(article.id)}
                                className="text-gray-400 hover:text-red-500 rounded-full p-1 transition-colors"
                            >
                                <HiX className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Autocomplete Input */}
            <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Tìm bài viết liên quan..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                        <div
                            ref={dropdownRef}
                            onScroll={handleScroll}
                            className="article-suggestions-dropdown absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                        >
                            {filteredArticles.length > 0 ? (
                                <>
                                    {filteredArticles.map(article => (
                                        <div
                                            key={article.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleAddArticle(article);
                                            }}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none group transition-colors"
                                        >
                                            <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{article.title}</div>
                                            <div className="text-xs text-gray-500 truncate mt-0.5">{article.slug}</div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 italic">
                                            Đang tải...
                                        </div>
                                    )}
                                    {hasMore && !isLoading && (
                                        <div className="px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 italic">
                                            Cuộn xuống để xem thêm
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                    {isLoading ? 'Đang tìm kiếm...' : 'Không tìm thấy bài viết nào'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleShowAll}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                    title="Hiện tất cả bài viết"
                >
                    <HiChevronDown className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default RelatedArticleSelector;
