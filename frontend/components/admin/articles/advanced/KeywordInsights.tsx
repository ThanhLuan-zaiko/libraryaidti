"use client";

import React from 'react';
import { FiTag, FiTrendingUp } from 'react-icons/fi';
import { TagStats } from '@/services/tag.service';

interface KeywordInsightsProps {
    tags: TagStats[];
}

const KeywordInsights: React.FC<KeywordInsightsProps> = ({ tags }) => {
    // Elegant colors for tags
    const colors = [
        'bg-blue-50 text-blue-700 border-blue-100',
        'bg-purple-50 text-purple-700 border-purple-100',
        'bg-pink-50 text-pink-700 border-pink-100',
        'bg-amber-50 text-amber-700 border-amber-100',
        'bg-green-50 text-green-700 border-green-100',
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-indigo-50/20">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiTag className="text-indigo-600" />
                    Từ khóa SEO Tiềm năng
                </h3>
            </div>

            <div className="p-6 flex-1 space-y-6">
                <div className="flex flex-wrap gap-2">
                    {tags.length > 0 ? tags.map((tag, idx) => (
                        <div
                            key={tag.id}
                            className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 hover:shadow-sm transition-all cursor-default ${colors[idx % colors.length]}`}
                        >
                            <span>#{tag.name}</span>
                            <span className="opacity-50 text-[10px]">{tag.usage_count}</span>
                        </div>
                    )) : (
                        <p className="text-xs text-gray-400 italic">Chưa có dữ liệu từ khóa.</p>
                    )}
                </div>

                {tags.length > 0 && (
                    <div className="p-5 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <FiTrendingUp className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Từ khóa hàng đầu</p>
                                <p className="text-lg font-black">{tags[0].name}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-indigo-200 leading-relaxed">
                            Từ khóa <span className="font-bold text-white">"{tags[0].name}"</span> hiện đang xuất hiện nhiều nhất trong mạng lưới nội dung của bạn.
                            Hãy tiếp tục đẩy mạnh các bài viết liên quan để xây dựng authority.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeywordInsights;
