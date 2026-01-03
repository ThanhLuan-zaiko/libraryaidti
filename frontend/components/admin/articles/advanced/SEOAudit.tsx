"use client";

import React from 'react';
import { FiSearch, FiAlertCircle, FiCheckCircle, FiShield } from 'react-icons/fi';

interface SEOAuditProps {
    stats: {
        missing_meta_description: number;
        missing_og_image: number;
        total_seo_records: number;
    };
}

const SEOAudit: React.FC<SEOAuditProps> = ({ stats }) => {
    const seoCoverage = Math.round(((stats.total_seo_records - stats.missing_meta_description) / (stats.total_seo_records || 1)) * 100);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-blue-50/20">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiSearch className="text-blue-600" />
                    Kiểm tra Sức khỏe SEO
                </h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${seoCoverage > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {seoCoverage > 80 ? 'Tốt' : 'Cần cải thiện'}
                </span>
            </div>

            <div className="p-6 flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                            <FiAlertCircle className="text-red-500 w-4 h-4" />
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Thiếu Meta Desc</p>
                        </div>
                        <p className="text-3xl font-black text-red-700">{stats.missing_meta_description}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                            <FiAlertCircle className="text-amber-500 w-4 h-4" />
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Thiếu OG Image</p>
                        </div>
                        <p className="text-3xl font-black text-amber-700">{stats.missing_og_image}</p>
                    </div>
                </div>

                <div className="p-5 bg-gray-900 rounded-2xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Độ bao phủ SEO bài viết</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black">{seoCoverage}%</span>
                            <span className="text-xs font-bold text-gray-400 mb-2">tổng quan</span>
                        </div>
                        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${seoCoverage}%` }}></div>
                        </div>
                    </div>
                    <FiShield className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Khuyến nghị</p>
                    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="mt-1 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FiCheckCircle className="text-blue-600 w-2.5 h-2.5" />
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed italic">
                            Bạn có <span className="font-bold text-gray-900">{stats.missing_meta_description} bài viết</span> chưa có mô tả meta. Hãy bổ sung để tăng tỷ lệ click-through trên Google.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SEOAudit;
