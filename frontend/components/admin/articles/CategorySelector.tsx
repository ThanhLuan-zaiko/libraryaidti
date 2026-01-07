import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HiX, HiChevronDown, HiFolder } from 'react-icons/hi';
import { Category, categoryService } from '@/services/category.service';

interface CategorySelectorProps {
    selectedCategoryId: string;
    onCategoryChange: (id: string, name?: string) => void;
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

const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategoryId, onCategoryChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch details for already selected category
    useEffect(() => {
        const fetchSelectedDetails = async () => {
            if (!selectedCategoryId) {
                setSelectedCategory(null);
                setInputValue('');
                return;
            }

            if (selectedCategory?.id === selectedCategoryId) return;

            try {
                const detail = await categoryService.getById(selectedCategoryId);
                setSelectedCategory(detail);
                setInputValue(detail.name);
            } catch (error) {
                console.error("Failed to fetch selected category details", error);
            }
        };
        fetchSelectedDetails();
    }, [selectedCategoryId]);

    const fetchCategories = async (search: string, pageNum: number, append: boolean = false) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const result = await categoryService.getList({
                page: pageNum,
                limit: 15,
                search: search,
                minimal: true
            });

            if (append) {
                setFilteredCategories(prev => [...prev, ...result.data]);
            } else {
                setFilteredCategories(result.data);
            }

            setHasMore(result.pagination.total_pages > pageNum);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedSearch = useDebounce((search: string) => {
        fetchCategories(search, 1, false);
    }, 300);

    // Initial search or search on input change
    useEffect(() => {
        if (showSuggestions) {
            // Only trigger search if input actually changed since last results
            // or if we have no results yet
            debouncedSearch(inputValue);
        }
    }, [inputValue, showSuggestions, debouncedSearch]);

    const handleSelectCategory = (category: Category) => {
        onCategoryChange(category.id, category.name);
        setSelectedCategory(category);
        setInputValue(category.name);
        setShowSuggestions(false);
    };

    const handleClearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCategoryChange('');
        setSelectedCategory(null);
        setInputValue('');
        setShowSuggestions(false);
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
            fetchCategories(inputValue, page + 1, true);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setShowSuggestions(false);
                    // Revert input to selected category name if not selecting
                    if (selectedCategory) {
                        setInputValue(selectedCategory.name);
                    } else {
                        setInputValue('');
                    }
                }
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSuggestions, selectedCategory]);

    return (
        <div className="relative">
            <div className="relative flex items-center gap-2">
                <div className="relative flex-1 group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <HiFolder className="w-4 h-4" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Chọn danh mục..."
                        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />

                    {selectedCategory && !showSuggestions && (
                        <button
                            onClick={handleClearSelection}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <HiX className="w-4 h-4" />
                        </button>
                    )}

                    {!selectedCategory && !showSuggestions && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                            <HiChevronDown className="w-4 h-4" />
                        </div>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                        <div
                            ref={dropdownRef}
                            onScroll={handleScroll}
                            className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                        >
                            {filteredCategories.length > 0 ? (
                                <>
                                    {filteredCategories.map(category => (
                                        <div
                                            key={category.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectCategory(category);
                                            }}
                                            className={`px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none group transition-colors flex items-center justify-between ${selectedCategoryId === category.id ? 'bg-blue-50' : ''}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${selectedCategoryId === category.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                    {category.name}
                                                </span>
                                                {category.parent && (
                                                    <span className="text-xs text-gray-400">Thuộc: {category.parent.name}</span>
                                                )}
                                            </div>
                                            {selectedCategoryId === category.id && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 italic">
                                            Đang tải...
                                        </div>
                                    )}
                                    {hasMore && !isLoading && (
                                        <div className="px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 italic">
                                            Cuộn để xem thêm
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                    {isLoading ? 'Đang tìm...' : 'Không tìm thấy danh mục nào'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleShowAll}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors flex-shrink-0"
                    title="Hiện tất cả danh mục"
                >
                    <HiChevronDown className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default CategorySelector;
