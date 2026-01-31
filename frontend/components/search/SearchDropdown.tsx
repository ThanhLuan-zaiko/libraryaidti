import React, { useRef, useEffect } from 'react';
import { Article } from '@/services/article.service';
import SearchResultItem from './SearchResultItem';
import { useClickOutside } from '@/hooks/useClickOutside';
import { HiSearch, HiX } from 'react-icons/hi';

interface SearchDropdownProps {
    query: string;
    isOpen: boolean;
    onClose: () => void;
    results: Article[];
    isLoading: boolean;
    totalResults: number;
    selectedIndex: number;
    onResultClick: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
    query,
    isOpen,
    onClose,
    results,
    isLoading,
    totalResults,
    selectedIndex,
    onResultClick
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useClickOutside(dropdownRef, onClose);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slideDown"
            style={{
                animation: 'slideDown 200ms ease-out'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <HiSearch className="w-4 h-4 text-blue-600" />
                    <span>
                        {isLoading ? 'Đang tìm kiếm...' : `Kết quả cho "${query}"`}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    aria-label="Đóng"
                >
                    <HiX className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                    // Loading skeleton
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-full" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <>
                        {results.map((article, index) => (
                            <SearchResultItem
                                key={article.id}
                                article={article}
                                query={query}
                                isSelected={index === selectedIndex}
                                onClick={onResultClick}
                            />
                        ))}
                    </>
                ) : (
                    // Empty state
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <HiSearch className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Không tìm thấy kết quả
                        </h3>
                        <p className="text-xs text-gray-500">
                            Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả
                        </p>
                    </div>
                )}
            </div>

            {/* Footer - Show all results button */}
            {!isLoading && results.length > 0 && totalResults > results.length && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <a
                        href={`/search?q=${encodeURIComponent(query)}`}
                        className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        onClick={onClose}
                    >
                        Xem tất cả {totalResults} kết quả →
                    </a>
                </div>
            )}

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default SearchDropdown;
