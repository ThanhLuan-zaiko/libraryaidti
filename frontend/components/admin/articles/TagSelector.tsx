import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HiX, HiChevronDown, HiCheck } from 'react-icons/hi';
import { tagService } from '@/services/tag.service';

interface Tag {
    id?: string;
    name: string;
    slug?: string;
}

interface TagSelectorProps {
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
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

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onTagsChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchTags = async (search: string, pageNum: number, append: boolean = false) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const result = await tagService.getList({
                page: pageNum,
                limit: 15,
                search: search
            });

            const newTags = result.data;

            if (append) {
                setFilteredTags(prev => [...prev, ...newTags]);
            } else {
                setFilteredTags(newTags);
            }

            setHasMore(result.pagination.total_pages > pageNum);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch tags", error);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedSearch = useDebounce((search: string) => {
        fetchTags(search, 1, false);
    }, 300);

    // Initial search or search on input change
    useEffect(() => {
        if (showSuggestions) {
            debouncedSearch(inputValue);
        }
    }, [inputValue, showSuggestions, debouncedSearch]); // Added debouncedSearch to dependency array

    const handleToggleTag = (tag: Tag) => {
        const isSelected = selectedTags.find(t => t.id === tag.id);
        if (isSelected) {
            onTagsChange(selectedTags.filter(t => t.id !== tag.id));
        } else {
            onTagsChange([...selectedTags, tag]);
        }
        // Do NOT close suggestions or clear input for batch selection
    };

    const handleRemoveTag = (tagId?: string) => {
        if (!tagId) return;
        onTagsChange(selectedTags.filter(t => t.id !== tagId));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredTags.length > 0) {
                handleToggleTag(filteredTags[0]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleShowAllTags = () => {
        setInputValue('');
        setShowSuggestions(true);
        inputRef.current?.focus();
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!hasMore || isLoading) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            fetchTags(inputValue, page + 1, true);
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
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                        <div
                            key={tag.id}
                            className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                            <span>{tag.name}</span>
                            <button
                                onClick={() => handleRemoveTag(tag.id)}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                            >
                                <HiX className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Autocomplete Input with Dropdown Button */}
            <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Gõ để tìm tag..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                        <div
                            ref={dropdownRef}
                            onScroll={handleScroll}
                            className="tag-suggestions-dropdown absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                        >
                            {filteredTags.length > 0 ? (
                                <>
                                    {filteredTags.map(tag => {
                                        const isSelected = selectedTags.some(st => st.id === tag.id);
                                        return (
                                            <div
                                                key={tag.id}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleToggleTag(tag);
                                                }}
                                                className={`px-3 py-2 flex items-center justify-between hover:bg-blue-50 cursor-pointer text-sm transition-colors group ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:text-blue-700'}`}
                                            >
                                                <span>{tag.name}</span>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                                    {isSelected && (
                                                        <HiCheck className="w-3 h-3 text-white" strokeWidth={2} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isLoading && (
                                        <div className="px-3 py-2 text-xs text-center text-gray-400 bg-gray-50 italic">
                                            Đang tải...
                                        </div>
                                    )}
                                    {hasMore && !isLoading && (
                                        <div className="px-3 py-2 text-xs text-center text-gray-400 bg-gray-50 italic">
                                            Cuộn xuống để xem thêm
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="px-3 py-2 text-sm text-gray-500 italic text-center">
                                    {isLoading ? 'Đang tìm...' : 'Không tìm thấy tag phù hợp'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Dropdown Toggle Button */}
                <button
                    type="button"
                    onClick={handleShowAllTags}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Hiện tất cả tags"
                >
                    <HiChevronDown className="w-4 h-4 text-gray-600" />
                </button>
            </div>
        </div>
    );
};

export default TagSelector;
