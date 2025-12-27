import { Tag } from "@/services/tag.service";
import { FiEdit2, FiTrash2, FiTag, FiArrowUp, FiArrowDown } from "react-icons/fi";

interface TagTableProps {
    tags: Tag[];
    loading: boolean;
    sortField: string;
    sortOrder: string;
    onEdit: (tag: Tag) => void;
    onDelete: (id: string) => void;
    onSort: (field: string) => void;
}

export default function TagTable({ tags, loading, sortField, sortOrder, onEdit, onDelete, onSort }: TagTableProps) {
    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (tags.length === 0) {
        return (
            <div className="p-12 text-center text-gray-400">
                <FiTag size={48} className="mx-auto mb-4 opacity-20" />
                <p>Không tìm thấy thẻ nào.</p>
            </div>
        );
    }

    const renderSortButton = (field: string, label: string) => {
        const isActive = sortField === field;
        return (
            <button
                onClick={() => onSort(field)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${isActive
                        ? 'bg-purple-100 text-purple-700 font-bold shadow-sm'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-purple-600'
                    }`}
            >
                {label}
                {isActive && (
                    sortOrder === "asc"
                        ? <FiArrowUp className="w-4 h-4" />
                        : <FiArrowDown className="w-4 h-4" />
                )}
            </button>
        );
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[800px]">
                <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-purple-200">
                    <div className="flex-1 flex items-center gap-2">
                        {renderSortButton("name", "Tên thẻ")}
                        <span className="text-gray-400">/</span>
                        {renderSortButton("slug", "Slug")}
                    </div>
                    <div className="w-32 text-right text-gray-500">Thao tác</div>
                </div>

                {tags.map(tag => (
                    <div key={tag.id} className="flex items-center p-4 border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
                        <div className="flex items-center flex-1">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-purple-100 text-purple-600">
                                <FiTag size={14} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{tag.name}</p>
                                <p className="text-xs text-gray-400 italic">/{tag.slug}</p>
                            </div>
                        </div>

                        <div className="w-32 flex justify-end space-x-2">
                            <button onClick={() => onEdit(tag)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                                <FiEdit2 size={16} />
                            </button>
                            <button onClick={() => onDelete(tag.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
