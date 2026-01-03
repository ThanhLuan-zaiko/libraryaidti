"use client";

import React from "react";
import { ActivityHeatmap } from "@/services/dashboard.service";

interface Props {
    data: ActivityHeatmap[];
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmapChart({ data }: Props) {
    // Transform data into a lookup map
    const heatMap = new Map<string, number>();
    let maxHits = 0;
    data.forEach(d => {
        heatMap.set(`${d.day.trim()}-${d.hour}`, d.hits);
        if (d.hits > maxHits) maxHits = d.hits;
    });

    const getColor = (hits: number) => {
        if (hits === 0) return "bg-gray-50";
        if (maxHits === 0) return "bg-gray-50"; // Should not happen if hits > 0
        const intensity = hits / maxHits;
        if (intensity < 0.2) return "bg-blue-100";
        if (intensity < 0.4) return "bg-blue-300";
        if (intensity < 0.6) return "bg-blue-500";
        if (intensity < 0.8) return "bg-blue-700";
        return "bg-blue-900";
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-gray-800">Bản đồ hoạt động hệ thống (7 ngày)</h4>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Ít</span>
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-blue-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-900 rounded-sm"></div>
                    </div>
                    <span>Nhiều</span>
                </div>
            </div>

            <div className="min-w-[600px]">
                <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1">
                    {/* Header Row (Hours) */}
                    <div className="h-6"></div> {/* CORNER */}
                    {HOURS.map(h => (
                        <div key={h} className="text-[10px] text-gray-400 text-center">
                            {h % 6 === 0 ? h : ""} {/* Show every 6th hour label */}
                        </div>
                    ))}

                    {/* Content Rows */}
                    {DAYS.map(day => (
                        <React.Fragment key={day}>
                            <div className="text-xs text-gray-500 py-1 pr-2 text-right font-medium">{day.substring(0, 3)}</div>
                            {HOURS.map(hour => {
                                const hits = heatMap.get(`${day}-${hour}`) || 0;
                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={`h-6 w-full rounded-sm ${getColor(hits)} transition-all hover:ring-2 hover:ring-blue-400 relative group cursor-default`}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded pointer-events-none whitespace-nowrap z-10">
                                            {hits} tác vụ lúc {hour}:00
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
