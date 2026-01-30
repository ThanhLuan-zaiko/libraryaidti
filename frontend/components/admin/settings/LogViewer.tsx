"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { settingsService, LogEntry } from "@/services/settings.service";
import {
    Database,
    ChevronRight,
    Info,
    Search,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { formatDate } from "@/utils/logUtils";

interface LogViewerProps {
    type: 'audit' | 'system';
}

export default function LogViewer({ type }: LogViewerProps) {
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [page, limit, debouncedSearch, type]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = type === 'audit'
                ? await settingsService.getAuditLogs(page, limit, "", "", debouncedSearch)
                : await settingsService.getSystemLogs(page, limit, "", debouncedSearch);
            setLogs(data.data);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (log: LogEntry) => {
        router.push(`/admin/settings/logs/${log.id}?type=${type}`);
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white shadow-sm border border-gray-100 group-focus-within:text-blue-600 transition-colors">
                        <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm hành động, bảng hoặc ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-13 pr-4 py-3.5 bg-white/40 backdrop-blur-xl border border-gray-100 rounded-[22px] outline-none text-sm font-semibold text-gray-700 placeholder:text-gray-300 focus:bg-white focus:border-blue-500/30 focus:shadow-2xl focus:shadow-blue-500/10 transition-all duration-300"
                    />
                </div>
                <div className="flex items-center space-x-4 shrink-0">
                    <div className="flex items-center space-x-2 bg-white/40 backdrop-blur-xl border border-gray-100 p-1.5 rounded-2xl">
                        {[25, 50, 75, 100].map((l) => (
                            <button
                                key={l}
                                onClick={() => { setLimit(l); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${limit === l ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900 hover:bg-white'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[32px] border border-gray-100 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">Thời gian</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">Quản trị viên</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">Hành động</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">Đối tượng</th>
                            <th className="px-8 py-5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-8 py-6">
                                        <div className="h-5 bg-gray-50 rounded-xl w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                                            <Info className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px]">Không tìm thấy nhật ký nào</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="group hover:bg-gray-50/80 transition-all duration-300 cursor-pointer"
                                    onClick={() => handleRowClick(log)}
                                >
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-gray-900 tabular-nums">{formatDate(log.created_at).split(', ')[1]}</span>
                                            <span className="text-[10px] font-bold text-gray-400 mt-0.5 tabular-nums">{formatDate(log.created_at).split(', ')[0]}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 text-gray-600 flex items-center justify-center font-black text-[11px] group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300 group-hover:scale-110 shadow-sm shrink-0">
                                                {log.user?.full_name?.charAt(0) || 'S'}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{log.user?.full_name || 'Hệ thống'}</span>
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest truncate">{log.user?.email || 'SYSTEM_EVENT'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-sm whitespace-nowrap ${log.action.includes('CREATE') ? 'bg-green-50 text-green-700 border border-green-100' :
                                            log.action.includes('UPDATE') ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                log.action.includes('DELETE') ? 'bg-red-50 text-red-700 border border-red-100' :
                                                    'bg-gray-50 text-gray-600 border border-gray-100'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center space-x-2">
                                            <Database className="w-3 h-3 text-gray-300" />
                                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter truncate">{log.table_name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right whitespace-nowrap">
                                        <div className="inline-flex p-2 rounded-xl bg-gray-50 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600 border border-transparent group-hover:border-blue-100 transition-all duration-300">
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 px-10 py-6 bg-white/40 backdrop-blur-xl rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 tabular-nums">
                    <span>Trang {page} / {Math.max(1, Math.ceil(total / limit))}</span>
                    <span className="hidden sm:block text-gray-200">|</span>
                    <span>Hiển thị {logs.length} / {total} kết quả</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:shadow-xl hover:shadow-gray-200/50 disabled:opacity-20 transition-all active:scale-95"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:shadow-xl hover:shadow-gray-200/50 disabled:opacity-20 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="hidden lg:flex items-center space-x-2 px-2">
                        {(() => {
                            const totalPages = Math.max(1, Math.ceil(total / limit));
                            const delta = 2;
                            const range = [];
                            for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
                                range.push(i);
                            }

                            if (page - delta > 2) range.unshift("...");
                            range.unshift(1);
                            if (page + delta < totalPages - 1) range.push("...");
                            if (totalPages > 1) range.push(totalPages);

                            return range.map((p, i) => (
                                typeof p === 'number' ? (
                                    <button
                                        key={i}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all duration-300 ${page === p
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-300'}`}
                                    >
                                        {p}
                                    </button>
                                ) : (
                                    <span key={i} className="text-gray-300 font-black px-1">...</span>
                                )
                            ));
                        })()}
                    </div>

                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page * limit >= total}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:shadow-xl hover:shadow-gray-200/50 disabled:opacity-20 transition-all active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPage(Math.ceil(total / limit))}
                        disabled={page * limit >= total}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:shadow-xl hover:shadow-gray-200/50 disabled:opacity-20 transition-all active:scale-95"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
