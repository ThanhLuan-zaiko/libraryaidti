import { Tag } from "@/services/tag.service";
import { FiEdit2, FiTrash2, FiTag, FiHash } from "react-icons/fi";

interface TagGridProps {
    tags: Tag[];
    loading: boolean;
    onEdit: (tag: Tag) => void;
    onDelete: (id: string) => void;
}

export default function TagGrid({ tags, loading, onEdit, onDelete }: TagGridProps) {
    if (loading) {
        return (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mb-4"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (tags.length === 0) {
        return (
            <div className="py-12 text-center text-gray-400">
                <FiTag size={48} className="mx-auto mb-4 opacity-20" />
                <p>Chưa có thẻ nào được tạo.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tags.map((tag) => (
                <div key={tag.id} className="group p-4 border border-gray-100 rounded-2xl hover:border-purple-200 hover:bg-purple-50/30 transition-all flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            <FiHash size={18} />
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(tag)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                                <FiEdit2 size={14} />
                            </button>
                            <button onClick={() => onDelete(tag.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                                <FiTrash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-gray-800">{tag.name}</p>
                        <p className="text-xs text-gray-400">#{tag.slug}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
