"use client";

import React from 'react';
import { FiAward, FiActivity, FiTag, FiBarChart2 } from 'react-icons/fi';
import { Article } from '@/services/article.service';
import { AdvancedAnalyticsData } from '@/services/dashboard.service';

interface ContentListsProps {
    topArticles: Article[];
    activities: any[];
    topTags: any[];
    advancedData: AdvancedAnalyticsData | null;
}

export default function ContentLists({ topArticles, activities, topTags, advancedData }: ContentListsProps) {
    // Calculate SEO Coverage
    const seoCoverage = advancedData
        ? Math.round(((advancedData.seo_stats.total_seo_records - advancedData.seo_stats.missing_meta_description) / (advancedData.seo_stats.total_seo_records || 1)) * 100)
        : 0;

    // Calculate Content Health Percentage
    const totalArticles = topArticles.length > 0 ? topArticles[0].view_count > 0 ? 5 : 0 : 0; // This is a bit weak, but we have advancedData
    const contentHealthPercentage = advancedData && advancedData.seo_stats.total_seo_records > 0
        ? Math.round((advancedData.content_health.good_content_length / advancedData.seo_stats.total_seo_records) * 100)
        : 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Articles */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FiAward className="text-amber-500" />
                            Bài viết hiệu suất cao
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {topArticles.map((article, idx) => (
                            <div key={article.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{article.title}</p>
                                    <p className="text-xs text-gray-500">{article.category?.name || 'Chưa phân loại'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-900">{article.view_count.toLocaleString('vi-VN')}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Lượt xem</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FiActivity className="text-blue-500" />
                            Hoạt động gần đây
                        </h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {activities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex gap-3 relative pb-4 last:pb-0">
                                {/* Timeline line */}
                                <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-gray-100 last:hidden"></div>

                                <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${activity.type.includes('published') ? 'bg-green-100 text-green-600' :
                                    activity.type.includes('user') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    <div className="w-2 h-2 rounded-full bg-current"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800 leading-tight">
                                        <span className="font-bold text-gray-900">{activity.user}</span> {activity.content}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
                                        {new Date(activity.timestamp).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tag Performance & Content Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tag Performance */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FiTag className="text-purple-500" />
                            Hiệu suất Thẻ (Tags)
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-3">
                            {topTags.map((tag) => (
                                <div key={tag.id} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all cursor-default group">
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">{tag.name}</span>
                                    <span className="px-1.5 py-0.5 bg-white rounded-md text-[10px] font-bold text-purple-600 border border-gray-100">
                                        {tag.usage_count}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Thẻ phổ biến nhất</p>
                                <p className="text-lg font-black text-blue-900">{topTags[0]?.name || '...'}</p>
                            </div>
                            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                                <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Mật độ thẻ/bài</p>
                                <p className="text-lg font-black text-purple-900">
                                    {advancedData?.content_health.avg_tag_density.toFixed(1) || '0.0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Health & SEO */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FiBarChart2 className="text-green-500" />
                            Sức khỏe Nội dung & SEO
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <HealthBar label="Độ phủ SEO (Meta Tags)" percentage={seoCoverage} color="bg-blue-500" />
                        <HealthBar label="Độ dài nội dung chuẩn" percentage={contentHealthPercentage} color="bg-amber-500" />

                        <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Phân loại Media</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Hình ảnh</span>
                                        <span className="font-bold text-gray-900">{advancedData?.media_stats.total_files || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Dung lượng</span>
                                        <span className="font-bold text-blue-600">
                                            {advancedData ? (advancedData.media_stats.total_size / (1024 * 1024)).toFixed(1) : '0.0'} MB
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Phiên bản bài viết</p>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-medium">Trung bình chỉnh sửa</p>
                                    <p className="text-lg font-black text-gray-900">
                                        {advancedData?.versioning_stats.avg_edits_per_article.toFixed(1) || '0.0'}
                                        <span className="text-[10px] text-gray-400 font-normal ml-1">lần/bài</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthBar({ label, percentage, color }: { label: string, percentage: number, color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-600">{label}</span>
                <span className="font-black text-gray-900">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}
