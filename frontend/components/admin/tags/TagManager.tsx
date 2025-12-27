"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useTagLogic } from "@/hooks/admin/useTagLogic";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Pagination from "@/components/admin/Pagination";
import TagModal from "./TagModal";
import TagTable from "./TagTable";
import TagActions from "./TagActions";
import { tagService, Tag } from "@/services/tag.service";

export default function TagManager() {
    // Logic Hook
    const {
        tags,
        pagination,
        loading,
        searchQuery,
        sortField,
        sortOrder,
        handlePageChange,
        handleSearch,
        handleLimitChange,
        handleSort,
        refreshData
    } = useTagLogic();

    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [tagToDelete, setTagToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Handlers
    const handleOpenModal = (tag?: Tag) => {
        setEditingTag(tag || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTag(null);
    };

    const handleOpenDeleteModal = (id: string) => {
        setTagToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!tagToDelete) return;
        try {
            setDeleting(true);
            await tagService.delete(tagToDelete);
            refreshData();
            setIsDeleteModalOpen(false);
            setTagToDelete(null);
        } catch (error) {
            console.error("Failed to delete tag:", error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Danh sách thẻ</h2>
                    <p className="text-sm text-gray-500">Quản lý các thẻ (tags) để gắn vào bài viết.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <FiPlus />
                    <span>Thêm thẻ mới</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-1">
                <TagActions
                    searchQuery={searchQuery}
                    onSearch={handleSearch}
                    limit={pagination.limit}
                    totalRows={pagination.total_rows}
                    onLimitChange={handleLimitChange}
                />

                <TagTable
                    tags={tags}
                    loading={loading}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    onEdit={handleOpenModal}
                    onDelete={handleOpenDeleteModal}
                />

                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.total_pages}
                    onPageChange={handlePageChange}
                />

                <div className="h-4"></div>
            </div>

            <TagModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={refreshData}
                editingTag={editingTag}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Xác nhận xóa thẻ"
                message="Dữ liệu bị xóa sẽ không thể khôi phục. Bạn có chắc chắn muốn thực hiện hành động này?"
                confirmText="Xóa ngay"
                cancelText="Quay lại"
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                loading={deleting}
            />
        </div>
    );
}
