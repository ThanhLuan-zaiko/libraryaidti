import { useState, useEffect } from "react";
import { Tag, tagService } from "@/services/tag.service";

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTag: Tag | null;
}

export default function TagModal({
    isOpen,
    onClose,
    onSuccess,
    editingTag
}: TagModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        slug: ""
    });

    useEffect(() => {
        if (editingTag) {
            setFormData({
                name: editingTag.name,
                slug: editingTag.slug
            });
        } else {
            setFormData({
                name: "",
                slug: ""
            });
        }
    }, [editingTag, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTag) {
                await tagService.update(editingTag.id, formData);
            } else {
                await tagService.create(formData);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save tag:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">
                        {editingTag ? "Chỉnh sửa thẻ" : "Thêm thẻ mới"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl">
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tên thẻ</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ví dụ: AI, Blockchain..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 text-gray-500"
                            placeholder="Tự động tạo nếu để trống"
                        />
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm"
                        >
                            {editingTag ? "Cập nhật" : "Lưu thẻ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
