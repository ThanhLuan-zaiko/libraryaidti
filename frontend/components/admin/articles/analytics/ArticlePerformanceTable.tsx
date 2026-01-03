"use client";

import React from 'react';
import { Article } from '@/services/article.service';
import { getImageUrl } from '@/utils/image';
import { FiEye, FiBarChart2, FiArrowUpRight, FiSearch } from 'react-icons/fi';
import Link from 'next/link';

interface ArticlePerformanceTableProps {
    articles: Article[];
}

const ArticlePerformanceTable: React.FC<ArticlePerformanceTableProps> = ({ articles }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiBarChart2 className="text-indigo-600" />
                    Hiệu suất Chi tiết bài viết
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase">Top 5 Bài viết</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Lượt xem</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Xu hướng</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {articles.map((article) => (
                            <tr key={article.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                                            {(() => {
                                                const primaryImg = article.images?.find(img => img.is_primary) || article.images?.[0];
                                                return primaryImg ? (
                                                    <img
                                                        src={getImageUrl(primaryImg.image_url)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <FiSearch className="w-4 h-4" />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{article.title}</p>
                                            <p className="text-[10px] text-gray-500 font-medium uppercase">{article.category?.name || 'Chưa phân loại'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                                        <FiEye className="w-3 h-3" />
                                        <span className="text-xs font-black">{article.view_count.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center">
                                        <div className="flex items-center gap-1 text-green-600">
                                            <FiArrowUpRight className="w-4 h-4" />
                                            <span className="text-xs font-bold">Tăng trưởng</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/admin/articles/${article.id}/edit`}
                                        className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        Chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-gray-50/30 text-center border-t border-gray-50">
                <button className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">Xem toàn bộ báo cáo hiệu suất</button>
            </div>
        </div>
    );
};

export default ArticlePerformanceTable;
