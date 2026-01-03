"use client";

import React from 'react';
import { FiShare2, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';

interface ContentRelationStatsProps {
    stats: {
        total_relations: number;
        orphan_pages: number;
        avg_links_per_article: number;
    };
}

const ContentRelationStats: React.FC<ContentRelationStatsProps> = ({ stats }) => {
    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700 p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                            <FiShare2 className="text-green-400" />
                            Mạng lưới Liên kết Nội bộ
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Sức mạnh kết nối và cấu trúc nội dung trên trang web</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black text-white">{stats.total_relations}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tổng liên kết</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiCheckCircle className="text-green-400 w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-white text-base mb-1">Cấu trúc kết nối</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">Trung bình <span className="text-green-400 font-bold">{stats.avg_links_per_article.toFixed(1)} liên kết</span> trên mỗi bài viết.</p>
                    </div>

                    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiAlertCircle className="text-amber-400 w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-white text-base mb-1">Trang mồ côi</h4>
                        <p className="text-xs text-gray-400 leading-relaxed"><span className="text-amber-400 font-bold">{stats.orphan_pages} bài viết</span> hiện chưa có bất kỳ liên kết nội bộ nào.</p>
                    </div>

                    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiShield className="text-blue-400 w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-white text-base mb-1">Mật độ bảo mật</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">Duy trì mạng lưới với <span className="text-blue-400 font-bold">{stats.total_relations} kết nối</span> nội bộ an toàn.</p>
                    </div>
                </div>

                <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <FiShare2 className="text-white w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-300">Xuất báo cáo mạng lưới nội dung (Graph Report)</span>
                    </div>
                    <FiCheckCircle className="text-gray-600 group-hover:text-green-400 transition-colors" />
                </div>
            </div>
        </div>
    );
};

export default ContentRelationStats;
