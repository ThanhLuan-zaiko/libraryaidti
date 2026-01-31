import React from 'react';
import Link from 'next/link';
import { Article } from '@/services/article.service';
import { highlightText, truncateText } from '@/utils/textHighlight';
import { HiEye, HiClock } from 'react-icons/hi';
import { getImageUrl } from '@/utils/image';

interface SearchResultItemProps {
    article: Article;
    query: string;
    isSelected?: boolean;
    onClick?: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ article, query, isSelected, onClick }) => {
    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Link
            href={`/article/${article.slug}`}
            onClick={onClick}
            className={`block px-4 py-3 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${isSelected
                ? 'bg-blue-50 scale-[1.02]'
                : 'hover:bg-gray-50 hover:scale-[1.01]'
                }`}
        >
            <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                    <img
                        src={getImageUrl(article.image_url) || '/placeholder-news.jpg'}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title with highlighting */}
                    <h4
                        className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1"
                        dangerouslySetInnerHTML={{
                            __html: highlightText(article.title, query)
                        }}
                    />

                    {/* Summary */}
                    {article.summary && (
                        <p
                            className="text-xs text-gray-600 line-clamp-1 mb-2"
                            dangerouslySetInnerHTML={{
                                __html: highlightText(truncateText(article.summary, 80), query)
                            }}
                        />
                    )}

                    {/* Meta Information */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        {/* Category Badge */}
                        {article.category?.name && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                {article.category.name}
                            </span>
                        )}

                        {/* View Count */}
                        <span className="flex items-center gap-1">
                            <HiEye className="w-3 h-3" />
                            {article.view_count || 0}
                        </span>

                        {/* Date */}
                        <span className="flex items-center gap-1">
                            <HiClock className="w-3 h-3" />
                            {formatDate(article.published_at || article.created_at)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default SearchResultItem;
