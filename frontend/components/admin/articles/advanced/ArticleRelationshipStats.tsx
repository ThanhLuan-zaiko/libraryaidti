"use client";

import React, { useState } from 'react';
import { FiLink, FiArrowRight, FiArrowLeft, FiRepeat, FiTrendingUp, FiEye } from 'react-icons/fi';
import { ArticleRelationStats } from '@/services/dashboard.service';
import ArticleRelationModal from './ArticleRelationModal';

interface ArticleRelationshipStatsProps {
    stats: ArticleRelationStats;
}

const ArticleRelationshipStats: React.FC<ArticleRelationshipStatsProps> = ({ stats }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<{
        id: string;
        title: string;
    } | null>(null);

    const handleArticleClick = (id: string, title: string) => {
        setSelectedArticle({ id, title });
        setModalOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
                        <FiLink className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 text-lg">Phân tích Mạng lưới Liên kết Nội bộ</h3>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Cấu trúc Internal Linking Structure</p>
                    </div>
                </div>

                {/* Bidirectional Stats Summary */}
                <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FiRepeat className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-bold text-purple-900">Liên kết 2 chiều</span>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-purple-900">{stats.bidirectional_stats.bidirectional_ratio.toFixed(1)}%</p>
                            <p className="text-xs text-purple-600 font-bold">
                                {stats.bidirectional_stats.bidirectional_links} / {stats.bidirectional_stats.total_links} liên kết
                            </p>
                        </div>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden border border-purple-100">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1000"
                            style={{ width: `${stats.bidirectional_stats.bidirectional_ratio}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Top Incoming & Outgoing Links */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Incoming Links */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <FiArrowLeft className="w-5 h-5 text-green-600" />
                        <h4 className="font-bold text-gray-800">Top Bài viết Được liên kết</h4>
                    </div>
                    <div className="space-y-3">
                        {stats.top_incoming_links.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu liên kết</p>
                        ) : (
                            stats.top_incoming_links.map((article, index) => (
                                <div
                                    key={article.article_id}
                                    onClick={() => handleArticleClick(article.article_id, article.article_title)}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors border border-transparent hover:border-green-100 cursor-pointer hover:shadow-md group"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{article.article_title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-gray-400 font-mono">ID: {article.article_id.substring(0, 8)}</p>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                            <div className="flex items-center gap-1 text-[10px] text-purple-500 font-bold uppercase transition-all group-hover:translate-x-1">
                                                <FiEye className="w-3 h-3" />
                                                <span>Xem chi tiết</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-black text-green-600">{article.incoming_count}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">links</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Outgoing Links */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <FiArrowRight className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-gray-800">Top Bài viết Liên kết Ra</h4>
                    </div>
                    <div className="space-y-3">
                        {stats.top_outgoing_links.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu liên kết</p>
                        ) : (
                            stats.top_outgoing_links.map((article, index) => (
                                <div
                                    key={article.article_id}
                                    onClick={() => handleArticleClick(article.article_id, article.article_title)}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100 cursor-pointer hover:shadow-md group"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{article.article_title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-gray-400 font-mono">ID: {article.article_id.substring(0, 8)}</p>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                            <div className="flex items-center gap-1 text-[10px] text-purple-500 font-bold uppercase transition-all group-hover:translate-x-1">
                                                <FiEye className="w-3 h-3" />
                                                <span>Xem chi tiết</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-black text-blue-600">{article.outgoing_count}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">links</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Category Relations */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <FiTrendingUp className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-gray-800">Phân bố Liên kết theo Danh mục</h4>
                </div>
                <div className="space-y-4">
                    {stats.category_relations.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu danh mục</p>
                    ) : (
                        stats.category_relations.map((category, index) => {
                            const maxCount = Math.max(...stats.category_relations.map(c => c.relation_count));
                            const percentage = maxCount > 0 ? (category.relation_count / maxCount) * 100 : 0;

                            return (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-700">{category.category_name}</span>
                                        <span className="text-sm font-black text-amber-600">{category.relation_count} liên kết</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Relationship Detail Modal */}
            <ArticleRelationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                articleId={selectedArticle?.id || ''}
                articleTitle={selectedArticle?.title || ''}
            />
        </div>
    );
};

export default ArticleRelationshipStats;
