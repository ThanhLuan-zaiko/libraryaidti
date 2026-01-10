"use client";

import React, { useState, useEffect } from 'react';
import { FiX, FiArrowLeft, FiArrowRight, FiLoader } from 'react-icons/fi';
import { articleService, ArticleRelationDetail } from '@/services/article.service';

interface ArticleRelationModalProps {
    isOpen: boolean;
    onClose: () => void;
    articleId: string;
    articleTitle: string;
}

const ArticleRelationModal: React.FC<ArticleRelationModalProps> = ({
    isOpen,
    onClose,
    articleId,
    articleTitle
}) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ArticleRelationDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && articleId) {
            fetchRelations();
        }
    }, [isOpen, articleId]);

    const fetchRelations = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await articleService.getRelations(articleId);
            setData(result);
        } catch (err) {
            console.error('Failed to fetch relations', err);
            setError('Không thể tải dữ liệu mối quan hệ');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="font-black text-xl text-gray-900 mb-1">
                                    Chi tiết Mối quan hệ
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2" title={articleTitle}>
                                    {articleTitle}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <FiLoader className="w-10 h-10 text-purple-600 animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                    <FiX className="w-8 h-8 text-red-600" />
                                </div>
                                <p className="text-sm text-red-600 font-medium">{error}</p>
                                <button
                                    onClick={fetchRelations}
                                    className="text-sm text-purple-600 hover:text-purple-700 font-bold"
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Incoming Articles */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                            <FiArrowLeft className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Được liên kết bởi</h4>
                                            <p className="text-xs text-gray-500">Các bài viết link đến bài này</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {!data?.incoming_articles || data.incoming_articles.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                                                <p className="text-sm text-gray-400">Chưa có bài viết nào link đến</p>
                                            </div>
                                        ) : (
                                            data.incoming_articles.map((article, index) => (
                                                <div
                                                    key={article.id}
                                                    className="p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors border border-green-100 group"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-xs font-black text-green-600 mt-0.5">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-green-700">
                                                                {article.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">/{article.slug}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Outgoing Articles */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <FiArrowRight className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">Liên kết đến</h4>
                                            <p className="text-xs text-gray-500">Các bài viết mà bài này link tới</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {!data?.outgoing_articles || data.outgoing_articles.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                                                <p className="text-sm text-gray-400">Chưa link đến bài viết nào</p>
                                            </div>
                                        ) : (
                                            data.outgoing_articles.map((article, index) => (
                                                <div
                                                    key={article.id}
                                                    className="p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 group"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-xs font-black text-blue-600 mt-0.5">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-blue-700">
                                                                {article.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">/{article.slug}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ArticleRelationModal;
