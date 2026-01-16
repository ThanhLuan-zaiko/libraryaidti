'use client';

import React, { useState, useEffect } from 'react';
import { HiStar, HiOutlineStar } from 'react-icons/hi';
import { articleService } from '@/services/article.service';
import { useAuth } from '@/hooks/useAuth';

interface StarRatingProps {
    articleId: string;
    initialAvg?: number;
    initialCount?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ articleId, initialAvg = 0, initialCount = 0 }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState<{ content: number; clarity: number; relevance: number } | null>(null);
    const [tempRating, setTempRating] = useState<{ content: number; clarity: number; relevance: number }>({ content: 0, clarity: 0, relevance: 0 });
    const [hover, setHover] = useState<{ type: string; value: number } | null>(null);
    const [stats, setStats] = useState({ average: initialAvg, count: initialCount });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        const fetchRating = async () => {
            try {
                const data = await articleService.getArticleRating(articleId);
                setStats({ average: data.average, count: data.count });
                setRating(data.user_rating);
                if (data.user_rating) {
                    setTempRating(data.user_rating);
                }
            } catch (error) {
                console.error('Error fetching rating:', error);
            }
        };

        if (articleId) fetchRating();
    }, [articleId, user]);

    const handleRate = async () => {
        if (!user) {
            setMessage({ text: 'Vui lòng đăng nhập để đánh giá!', type: 'info' });
            return;
        }

        if (tempRating.content === 0 || tempRating.clarity === 0 || tempRating.relevance === 0) {
            setMessage({ text: 'Vui lòng chấm điểm tất cả các tiêu chí!', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            await articleService.rateArticle(articleId, tempRating);
            setRating(tempRating);

            // Re-fetch stats
            const data = await articleService.getArticleRating(articleId);
            setStats({ average: data.average, count: data.count });

            setMessage({ text: 'Cảm ơn đánh giá chi tiết của bạn!', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.error || 'Đã có lỗi xảy ra', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const criteria = [
        { key: 'content', label: 'Nội dung', desc: 'Kiến thức chính xác & sâu sắc' },
        { key: 'clarity', label: 'Trình bày', desc: 'Dễ hiểu & mạch lạc' },
        { key: 'relevance', label: 'Ứng dụng', desc: 'Thực tế & hữu ích' },
    ];

    const renderStars = (key: 'content' | 'clarity' | 'relevance') => (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onMouseEnter={() => setHover({ type: key, value: star })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setTempRating(prev => ({ ...prev, [key]: star }))}
                    disabled={loading}
                    className={`p-1 transition-all duration-200 hover:scale-110 active:scale-95 ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                    {(hover?.type === key ? hover.value >= star : tempRating[key] >= star) ? (
                        <HiStar className={`w-6 h-6 ${hover?.type === key ? 'text-yellow-400' : 'text-yellow-500'} drop-shadow-sm`} />
                    ) : (
                        <HiOutlineStar className="w-6 h-6 text-gray-300 hover:text-yellow-200" />
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-6">
                <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Đánh giá chất lượng</h3>
                        <p className="text-sm text-gray-500">Hãy giúp chúng tôi cải thiện bằng cách đánh giá chi tiết</p>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                        <HiStar className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-black text-gray-900">{stats.average.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 font-medium">({stats.count} lượt)</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {criteria.map((c) => (
                        <div key={c.key} className="flex flex-col items-center p-3 bg-white/50 rounded-xl border border-gray-50">
                            <span className="font-semibold text-gray-700">{c.label}</span>
                            <span className="text-xs text-gray-400 mb-2 text-center">{c.desc}</span>
                            {renderStars(c.key as any)}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end items-center gap-4 border-t border-gray-100 pt-4">
                    {message && (
                        <p
                            className={`text-sm font-bold tracking-tight uppercase animate-in fade-in slide-in-from-bottom-2 duration-300 ${message.type === 'success' ? 'text-emerald-600' :
                                message.type === 'error' ? 'text-rose-600' : 'text-blue-600'
                                }`}
                        >
                            {message.text}
                        </p>
                    )}
                    <button
                        onClick={handleRate}
                        disabled={loading}
                        className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StarRating;
