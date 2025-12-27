import { Category } from "@/services/category.service";
import { FiEdit2, FiTrash2, FiFolder, FiArrowUp, FiArrowDown } from "react-icons/fi";

interface CategoryTableProps {
    categories: Category[];
    loading: boolean;
    sortField: string;
    sortOrder: string;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
    onSort: (field: string) => void;
}

export default function CategoryTable({ categories, loading, sortField, sortOrder, onEdit, onDelete, onSort }: CategoryTableProps) {
    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="p-12 text-center text-gray-400">
                <FiFolder size={48} className="mx-auto mb-4 opacity-20" />
                <p>Không tìm thấy danh mục nào.</p>
            </div>
        );
    }

    const renderSortButton = (field: string, label: string) => {
        const isActive = sortField === field;
        return (
            <button
                onClick={() => onSort(field)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${isActive
                    ? 'bg-blue-100 text-blue-700 font-bold shadow-sm'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-blue-600'
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
                <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200">
                    <div className="flex-1 flex items-center gap-2">
                        {renderSortButton("name", "Tên danh mục")}
                    </div>
                    <div className="flex-1 text-gray-500">Danh mục cha</div>
                    <div className="hidden md:block flex-1 text-gray-500">Mô tả</div>
                    <div className="w-24 text-center flex items-center justify-center">
                        {renderSortButton("is_active", "Trạng thái")}
                    </div>
                    <div className="w-32 text-right text-gray-500">Thao tác</div>
                </div>

                {categories.map(category => (
                    <div key={category.id} className="flex items-center p-4 border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        <div className="flex items-center flex-1">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-blue-100 text-blue-600">
                                <FiFolder size={14} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{category.name}</p>
                                <p className="text-xs text-gray-400 italic">/{category.slug}</p>
                            </div>
                        </div>

                        <div className="flex-1 text-sm text-gray-600">
                            {category.parent ? (
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
                                    {category.parent.name}
                                </span>
                            ) : (
                                <span className="text-gray-400 italic">Gốc</span>
                            )}
                        </div>

                        <div className="hidden md:block flex-1 text-sm text-gray-500 truncate pr-4">
                            {category.description || "—"}
                        </div>

                        <div className="w-24 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {category.is_active ? "Hiện" : "Ẩn"}
                            </span>
                        </div>

                        <div className="w-32 flex justify-end space-x-2">
                            <button onClick={() => onEdit(category)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                                <FiEdit2 size={16} />
                            </button>
                            <button onClick={() => onDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
