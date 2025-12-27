import React from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";

interface TagActionsProps {
    searchQuery: string;
    onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    limit: number;
    totalRows: number;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function TagActions({
    searchQuery,
    onSearch,
    limit,
    totalRows,
    onLimitChange
}: TagActionsProps) {
    return (
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm thẻ..."
                    value={searchQuery}
                    onChange={onSearch}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Tổng: <b>{totalRows}</b></span>
                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Hiển thị:</span>
                <div className="relative">
                    <select
                        value={limit}
                        onChange={onLimitChange}
                        className="appearance-none pl-4 pr-10 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white transition-colors cursor-pointer"
                    >
                        <option value={10}>10 hàng</option>
                        <option value={25}>25 hàng</option>
                        <option value={50}>50 hàng</option>
                        <option value={75}>75 hàng</option>
                        <option value={100}>100 hàng</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>
    );
}
