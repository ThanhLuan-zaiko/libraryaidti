"use client";

import React from "react";
import { EditorialSpeed } from "@/services/dashboard.service";
import { HiOutlineLightningBolt, HiOutlineCheckCircle } from "react-icons/hi";

interface Props {
    data: EditorialSpeed;
}

export default function EditorialVelocity({ data }: Props) {
    // Determine status color based on speed (totally arbitrary thresholds for demo)
    // < 1 day = Fast (Green), < 3 days = Normal (Blue), > 3 days = Slow (Orange)
    const getSpeedColor = (days: number) => {
        if (days < 1) return "text-green-500";
        if (days < 3) return "text-blue-500";
        return "text-orange-500";
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <HiOutlineLightningBolt className="w-24 h-24" />
            </div>

            <h4 className="font-bold text-gray-800 mb-4 flex items-center z-10 relative">
                <HiOutlineLightningBolt className="w-5 h-5 mr-2 text-yellow-500" />
                Tốc độ biên tập
            </h4>

            <div className="space-y-6 z-10 relative">
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Thời gian trung bình (Nháp → Đăng)</p>
                    <div className="flex items-baseline mt-1">
                        <span className={`text-3xl font-bold ${getSpeedColor(data.draft_to_publish_days)}`}>
                            {data.draft_to_publish_days.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400 ml-2">ngày</span>
                    </div>
                    {data.draft_to_publish_days === 0 && (
                        <p className="text-[10px] text-gray-400 mt-1 italic">Chưa có dữ liệu lịch sử</p>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium uppercase mb-2">Đã xuất bản (Tổng cộng)</p>
                    <div className="flex items-center">
                        <HiOutlineCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-lg font-bold text-gray-700">{data.total_published}</span>
                        <span className="text-xs text-gray-400 ml-2">bài viết</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
