"use client";

import React from 'react';
import { FiHardDrive, FiLayers, FiActivity, FiBriefcase } from 'react-icons/fi';

interface TechnicalOverviewProps {
    mediaStats: {
        total_files: number;
        total_size: number;
    };
    versioningStats: {
        avg_edits_per_article: number;
        total_versions: number;
    };
}

const TechnicalOverview: React.FC<TechnicalOverviewProps> = ({ mediaStats, versioningStats }) => {
    const sizeInMB = (mediaStats.total_size / (1024 * 1024)).toFixed(1);
    const storagePercentage = Math.min(100, (mediaStats.total_size / (500 * 1024 * 1024)) * 100);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Media Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative group">
                <FiBriefcase className="absolute -right-6 -bottom-6 text-gray-50 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform" />
                <div className="relative z-10">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FiHardDrive className="text-amber-500" />
                        Tài nguyên & Media
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-[10px] mb-2">
                                <span className="text-gray-500 font-bold uppercase tracking-widest">Dung lượng sử dụng</span>
                                <span className="font-black text-gray-900">{sizeInMB} MB / 500 MB</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-inner transition-all duration-1000"
                                    style={{ width: `${storagePercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Tổng file</p>
                                <p className="text-2xl font-black text-amber-900">{mediaStats.total_files}</p>
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">TB / File</p>
                                <p className="text-2xl font-black text-blue-900">
                                    {(mediaStats.total_size / (mediaStats.total_files || 1) / 1024).toFixed(0)} KB
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Versioning Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-1">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FiLayers className="text-indigo-500" />
                    Chỉ số Phiên bản & Chỉnh sửa
                </h3>

                <div className="space-y-6">
                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Hiệu suất biên tập</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-indigo-900">{versioningStats.avg_edits_per_article.toFixed(1)}</span>
                                <span className="text-[10px] font-bold text-indigo-400">chỉnh sửa / bài</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                            <FiActivity className="w-6 h-6 animate-pulse" />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 border border-transparent hover:border-gray-200 transition-colors">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
                            <FiLayers className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng số phiên bản đã lưu</p>
                            <p className="text-lg font-black text-gray-900">{versioningStats.total_versions.toLocaleString()} phiên bản</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicalOverview;
