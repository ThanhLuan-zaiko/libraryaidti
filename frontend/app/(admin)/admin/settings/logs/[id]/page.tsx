"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { settingsService, LogEntry } from "@/services/settings.service";
import { DataViewer } from "@/components/admin/settings/DataViewer";
import {
    ChevronLeft,
    History,
    User,
    Activity,
    Calendar,
    Database,
    Info,
    ArrowRight,
    Hash
} from "lucide-react";
import { formatDate, getLabel } from "@/utils/logUtils";

export default function LogDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const searchParams = useSearchParams();
    const type = searchParams.get("type") as 'audit' | 'system' || 'audit';
    const [log, setLog] = useState<LogEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLog = async () => {
            if (!id) return;
            try {
                const data = await settingsService.getLogById(id, type);
                setLog(data);
            } catch (err) {
                console.error(err);
                setError("Không thể tải thông tin nhật ký. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        fetchLog();
    }, [id, type]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !log) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-red-50 rounded-full">
                    <History className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{error || "Không tìm thấy nhật ký"}</h2>
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-blue-600 font-bold hover:underline"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                </button>
            </div>
        );
    }

    // Always calculate keys for diff view
    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    // Only show keys that have differences
    const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl border border-gray-100 transition-all duration-200 group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chi tiết nhật ký</h1>
                            <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-500 uppercase tracking-widest">{type === 'audit' ? 'Hoạt động' : 'Hệ thống'}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {log.id}</p>
                    </div>
                </div>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center space-x-2 text-gray-400">
                        <User className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Thực hiện bởi</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-900">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-sm text-blue-600 border border-blue-100">
                            {log.user?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold truncate">{log.user?.full_name || 'Hệ thống'}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{log.user?.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center space-x-2 text-gray-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Hành động</span>
                    </div>
                    <div>
                        <span className={`inline-flex px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight ${log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                            log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-700' :
                                log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            {log.action}
                        </span>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Thời gian</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                        {formatDate(log.created_at)}
                    </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center space-x-2 text-gray-400">
                        <Database className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Đối tượng</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-gray-700 uppercase tracking-tight bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">{log.table_name || 'UNKNOWN'}</span>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <div className="flex items-center space-x-1 text-gray-400">
                            <Hash className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{log.record_id?.substring(0, 8) || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Diff Section */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Chi tiết thay đổi dữ liệu
                    </h3>
                </div>

                <div className="p-8 space-y-6">
                    {allKeys.map(key => {
                        const ov = oldData[key];
                        const nv = newData[key];
                        // Skip if values are identical (simple JSON stringify check)
                        if (JSON.stringify(ov) === JSON.stringify(nv)) return null;

                        return (
                            <div key={key} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-100 transition-colors">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Info className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-black uppercase text-gray-500 tracking-[0.2em]">{getLabel(key)}</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-6 items-start">
                                    {/* Old Data */}
                                    {ov !== undefined && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                Giá trị cũ
                                            </span>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="text-sm text-gray-600 font-medium break-all leading-relaxed">
                                                    <DataViewer data={ov} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Arrow */}
                                    {ov !== undefined && nv !== undefined && (
                                        <div className="flex justify-center pt-8">
                                            <div className="text-gray-300">
                                                <ArrowRight className="w-5 h-5 lg:rotate-0 rotate-90" />
                                            </div>
                                        </div>
                                    )}

                                    {/* New Data */}
                                    {nv !== undefined && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                                Giá trị mới
                                            </span>
                                            <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100 ring-2 ring-blue-50/20">
                                                <div className="text-sm text-gray-900 font-bold break-all leading-relaxed">
                                                    <DataViewer data={nv} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {allKeys.filter(key => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])).length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Activity className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Không có dữ liệu thay đổi</h3>
                            <p className="text-gray-400 mt-2">Hành động này không làm thay đổi dữ liệu nào trong bản ghi.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
