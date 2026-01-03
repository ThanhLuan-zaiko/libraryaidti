import React, { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiFilter, HiSearch, HiOutlineDocumentText, HiStar, HiChartBar, HiTable, HiLightningBolt } from 'react-icons/hi';
import { useArticleLogic } from '@/hooks/admin/useArticleLogic';
import ArticleAnalytics from './ArticleAnalytics';
import ArticleManagementAdvanced from './ArticleManagementAdvanced';
import Tabs from '@/components/admin/Tabs';

import { articleService, ArticleInput } from '@/services/article.service';
import { categoryService, Category } from '@/services/category.service';
import Pagination from '@/components/admin/Pagination';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { getImageUrl } from '@/utils/image';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ArticleManager = () => {
    const router = useRouter();
    const {
        articles,
        loading,
        pagination,
        searchQuery,
        statusFilter,
        categoryFilter,
        handleSearch,
        handlePageChange,
        handleStatusFilter,
        setCategoryFilter,
        handleLimitChange,
        refreshData
    } = useArticleLogic();

    const [categories, setCategories] = useState<Category[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.getAll();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    const handleDeleteClick = (id: string) => {
        setArticleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const [activeTab, setActiveTab] = useState('management');

    const tabs = [
        { id: 'management', label: 'Quản lý bài viết', icon: <HiTable className="w-5 h-5" /> },
        { id: 'analytics', label: 'Phân tích & Hiệu suất', icon: <HiChartBar className="w-5 h-5" /> },
        { id: 'advanced', label: 'Báo cáo Chuyên sâu & SEO', icon: <HiLightningBolt className="w-5 h-5" /> },
    ];

    const handleConfirmDelete = async () => {
        if (articleToDelete) {
            await articleService.delete(articleToDelete);
            refreshData();
            setIsDeleteModalOpen(false);
        }
    };



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý nội dung</h1>
                    <p className="text-sm text-gray-500">Xem trung tâm phân tích và quản lý tất cả bài viết của bạn.</p>
                </div>
                <button
                    onClick={() => router.push('/admin/articles/create')}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-sm"
                >
                    <HiPlus className="w-5 h-5" />
                    <span>Viết bài mới</span>
                </button>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'analytics' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ArticleAnalytics />
                </div>
            )}

            {activeTab === 'advanced' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ArticleManagementAdvanced />
                </div>
            )}

            {activeTab === 'management' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full lg:w-96">
                            <input
                                type="text"
                                placeholder="Tìm theo tiêu đề, danh mục, tác giả..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                            <HiSearch className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none font-medium min-w-[140px]"
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none font-medium min-w-[140px]"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PUBLISHED">Đã đăng</option>
                                <option value="DRAFT">Bản nháp</option>
                                <option value="REVIEW">Chờ duyệt</option>
                            </select>

                            <div className="flex items-center gap-2 ml-auto lg:ml-0">
                                <span className="text-xs font-bold text-gray-400 uppercase">Hiển thị:</span>
                                <select
                                    value={pagination.limit}
                                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                                    className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none font-bold"
                                >
                                    {[25, 50, 75, 100].map(limit => (
                                        <option key={limit} value={limit}>{limit}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider w-16">Ảnh</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Tiêu đề</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Danh mục</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Tác giả</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Nổi bật</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Lượt xem</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                                    <p className="text-sm font-bold text-gray-400">Đang tải dữ liệu...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : articles.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <HiOutlineDocumentText className="w-12 h-12 text-gray-200" />
                                                    <p className="text-sm font-bold text-gray-400">Không tìm thấy bài viết nào.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        articles.map((article) => (
                                            <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
                                                        {(() => {
                                                            const primaryImg = article.images?.find(img => img.is_primary) || article.images?.[0];
                                                            const thumbUrl = primaryImg?.image_url;
                                                            return thumbUrl ? (
                                                                <img
                                                                    src={getImageUrl(thumbUrl)}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <HiOutlineDocumentText className="w-6 h-6" />
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-900 line-clamp-1">{article.title}</div>
                                                    <div className="text-xs text-gray-500">{article.slug}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                    {article.category?.name || <span className="text-gray-400 italic">Chưa phân loại</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{article.author?.full_name || 'Admin'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {article.is_featured ? (
                                                        <div className="flex justify-center">
                                                            <HiStar className="w-5 h-5 text-amber-500 fill-current" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                                        article.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {article.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-blue-600">{article.view_count.toLocaleString('vi-VN')}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(article.created_at).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => router.push(`/admin/articles/${article.id}/edit`)} className="text-amber-600 hover:text-amber-800 p-1 transition-colors"><HiPencil className="w-5 h-5" /></button>
                                                    <button onClick={() => handleDeleteClick(article.id)} className="text-red-600 hover:text-red-800 p-1 transition-colors"><HiTrash className="w-5 h-5" /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-200">
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={Math.ceil(pagination.total / pagination.limit)}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Xóa bài viết"
                message="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default ArticleManager;
