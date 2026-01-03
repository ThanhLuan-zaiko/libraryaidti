"use client";

import React from "react";
import { SystemPulse as SystemPulseType } from "@/services/dashboard.service";
import { HiOutlineChip, HiOutlineDatabase, HiOutlineServer, HiOutlineClock } from "react-icons/hi";

interface Props {
    data: SystemPulseType;
}

export default function SystemPulse({ data }: Props) {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        return `${days}d ${hours}h`;
    };

    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center">
                    <span className="relative flex h-3 w-3 mr-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    System Pulse
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                    LIVE MONITOR
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* CPU */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center text-slate-400 text-xs uppercase font-bold mb-2">
                        <HiOutlineChip className="w-4 h-4 mr-2" /> CPU Cores
                    </div>
                    <div className="text-2xl font-mono font-bold text-red-400">
                        {data.cpu_usage || "-"}
                    </div>
                </div>

                {/* Memory */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center text-slate-400 text-xs uppercase font-bold mb-2">
                        <HiOutlineChip className="w-4 h-4 mr-2" /> Memory
                    </div>
                    <div className="text-2xl font-mono font-bold text-blue-400">
                        {formatBytes(data.memory_usage)}
                    </div>
                </div>

                {/* Goroutines */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center text-slate-400 text-xs uppercase font-bold mb-2">
                        <HiOutlineServer className="w-4 h-4 mr-2" /> Goroutines
                    </div>
                    <div className="text-2xl font-mono font-bold text-purple-400">
                        {data.goroutines}
                    </div>
                </div>

                {/* DB Connections */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center text-slate-400 text-xs uppercase font-bold mb-2">
                        <HiOutlineDatabase className="w-4 h-4 mr-2" /> DB Conn
                    </div>
                    <div className="text-2xl font-mono font-bold text-green-400">
                        {data.db_connections}
                    </div>
                </div>

                {/* Uptime */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center text-slate-400 text-xs uppercase font-bold mb-2">
                        <HiOutlineClock className="w-4 h-4 mr-2" /> Uptime
                    </div>
                    <div className="text-2xl font-mono font-bold text-orange-400">
                        {formatUptime(data.uptime_seconds)}
                    </div>
                </div>
            </div>
        </div>
    );
}
