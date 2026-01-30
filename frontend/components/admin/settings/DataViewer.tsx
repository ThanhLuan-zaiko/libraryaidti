"use client";

import { useState } from "react";
import { getLabel } from "@/utils/logUtils";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

// Helper Component for Long Text
const TextRenderer = ({ text }: { text: string }) => {
    const [expanded, setExpanded] = useState(false);
    const shouldTruncate = text.length > 150;

    if (!shouldTruncate) return <span className="font-medium break-words text-sm text-gray-700">{text}</span>;

    return (
        <div className="min-w-[150px] relative group">
            <div className={`text-sm font-medium text-gray-700 break-words transition-all ${expanded ? '' : 'line-clamp-3'}`}>
                {text}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-[10px] text-blue-500 font-bold mt-1 uppercase hover:underline flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-md px-1"
            >
                {expanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
        </div>
    );
};

// Helper Component for Data Visualization
export const DataViewer = ({ data, isNested = false }: { data: any, isNested?: boolean }) => {
    const [collapsed, setCollapsed] = useState(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const BASE_URL = API_URL.endsWith('/api/v1') ? API_URL.replace('/api/v1', '') : API_URL;

    if (data === null || data === undefined) return <span className="italic opacity-40 text-gray-400 text-xs">-</span>;

    if (typeof data !== 'object') {
        // Handle images
        const isImage = typeof data === 'string' &&
            !data.includes(' ') &&
            /\.(jpg|jpeg|png|gif|webp)$/i.test(data) &&
            (data.startsWith('http') || data.startsWith('/uploads/') || data.startsWith('uploads/'));

        if (isImage) {
            const isUpload = data.startsWith('/uploads/') || data.startsWith('uploads/');
            const urlPrefix = isUpload ? BASE_URL : API_URL;
            const fullSrc = data.startsWith('http') ? data : `${urlPrefix}${data.startsWith('/') ? '' : '/'}${data}`;
            return (
                <div className="relative group/img inline-block">
                    <img
                        src={fullSrc}
                        alt="Media"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                        className="h-20 w-20 rounded-lg border border-gray-200 object-cover my-1 cursor-zoom-in hover:scale-105 transition-transform bg-white shadow-sm"
                    />
                    <span className="hidden text-[10px] text-gray-400 italic p-2 bg-gray-50 rounded">Image unavailable</span>
                </div>
            );
        }
        if (typeof data === 'boolean') {
            return <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm border ${data ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{data ? 'TRUE' : 'FALSE'}</span>;
        }
        return <TextRenderer text={String(data)} />;
    }

    // Array Handling
    if (Array.isArray(data)) {
        if (data.length === 0) return <span className="italic opacity-50 text-[10px] text-gray-400">Empty List</span>;

        // Check if array of objects
        const isArrayOfObjects = data.some(item => typeof item === 'object' && item !== null);

        // Render Table ONLY if NOT nested (to avoid recursive table hella)
        if (isArrayOfObjects && !isNested) {
            const allKeys = Array.from(new Set(data.flatMap(item => item ? Object.keys(item) : [])));
            return (
                <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm my-2 ring-4 ring-gray-50/50">
                    <div className="overflow-x-auto max-w-full">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 whitespace-nowrap w-4 text-[10px] font-black uppercase text-gray-400 text-center sticky left-0 bg-gray-50">#</th>
                                    {allKeys.map(k => (
                                        <th key={k} className="px-4 py-3 whitespace-nowrap text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                            {getLabel(k)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-3 font-mono text-gray-400 font-bold text-[10px] bg-gray-50/30 text-center sticky left-0 group-hover:bg-blue-50/30 transition-colors">{idx + 1}</td>
                                        {allKeys.map(k => (
                                            <td key={k} className="px-4 py-3 min-w-[120px] max-w-[300px] align-top">
                                                {/* Pass isNested=true to prevent tables inside tables */}
                                                {item && typeof item === 'object' ? <DataViewer data={item[k]} isNested={true} /> : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // Simple List / Nested List View
        return (
            <div className="flex flex-col space-y-2 my-1">
                {isNested && data.length > 1 && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors w-fit mb-1"
                    >
                        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{data.length} items</span>
                    </button>
                )}

                {(!isNested || !collapsed) && data.map((item, idx) => (
                    <div key={idx} className={`flex items-start space-x-2 ${isNested ? 'pl-2 border-l-2 border-gray-100' : ''}`}>
                        <span className="text-[9px] font-black text-gray-300 mt-1.5 shrink-0 select-none">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                            <DataViewer data={item} isNested={true} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Objects
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="italic opacity-50 text-[10px]">Empty Object</span>;

    // Compact Object View for Nested Contexts
    if (isNested) {
        return (
            <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-2 text-xs hover:border-blue-200 transition-colors">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-between w-full space-x-2 text-[10px] font-bold text-gray-500 mb-1 hover:text-blue-600"
                >
                    <span className="uppercase tracking-wider">Object ({entries.length})</span>
                    {collapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>

                {!collapsed && (
                    <div className="grid grid-cols-1 gap-1.5 mt-2 animate-in slide-in-from-top-1 duration-200">
                        {entries.map(([key, value]) => (
                            <div key={key} className="flex flex-col border-l-2 border-gray-200 pl-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider truncate" title={key}>{getLabel(key)}</span>
                                <div className="mt-0.5">
                                    <DataViewer data={value} isNested={true} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-1">
            {entries.map(([key, value]) => (
                <div key={key} className="flex flex-col p-4 bg-gray-50/30 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/5 transition-all group/item">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover/item:text-blue-400 transition-colors" title={key}>
                        {getLabel(key)}
                    </span>
                    <div className="w-full">
                        <DataViewer data={value} isNested={true} />
                    </div>
                </div>
            ))}
        </div>
    );
};
