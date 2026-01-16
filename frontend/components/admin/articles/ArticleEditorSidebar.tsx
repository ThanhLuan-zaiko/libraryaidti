import React from 'react';
import { HiChevronDown, HiChevronUp, HiPlus, HiX, HiLightningBolt, HiPhotograph, HiTrash, HiExternalLink } from 'react-icons/hi';
import { Category } from '@/services/category.service';
import { Tag } from '@/services/tag.service';
import { ArticleInput, ArticleSeoRedirect, articleService } from '@/services/article.service';
import ImageGallery from './ImageGallery';
import TagSelector from './TagSelector';
import CategorySelector from './CategorySelector';
import RelatedArticleSelector from './RelatedArticleSelector';
import SeoPreview from './SeoPreview';

interface ArticleEditorSidebarProps {
    formData: ArticleInput;
    articleId?: string;
    redirects?: ArticleSeoRedirect[];
    showSeoSection: boolean;
    onFormDataChange: (data: Partial<ArticleInput>) => void;
    onToggleFeatured: () => void;
    onToggleSeoSection: () => void;
    onRedirectsChange?: (redirects: ArticleSeoRedirect[]) => void;
    onNotify: (type: 'success' | 'error', message: string) => void;
    onImageInsert?: (url: string, description?: string, index?: number) => boolean;
    onImageRemove?: (image: any) => void; // Using any for simplicity as ArticleInput['images'][0] is not exported
}

const ArticleEditorSidebar: React.FC<ArticleEditorSidebarProps> = ({
    formData,
    articleId,
    redirects = [],
    showSeoSection,
    onFormDataChange,
    onToggleFeatured,
    onToggleSeoSection,
    onRedirectsChange,
    onNotify,
    onImageInsert,
    onImageRemove,
}) => {
    const [confirmOverwrite, setConfirmOverwrite] = React.useState(false);
    const [newRedirectSlug, setNewRedirectSlug] = React.useState('');
    const [addingRedirect, setAddingRedirect] = React.useState(false);
    const confirmTimeoutRef = React.useRef<NodeJS.Timeout>(null);

    React.useEffect(() => {
        return () => {
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        };
    }, []);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFormDataChange({ [name]: value });
    };

    const handleUsePrimaryImage = () => {
        const primaryImage = formData.images?.find(img => img.is_primary);
        if (primaryImage?.image_url) {
            onFormDataChange({
                seo_metadata: {
                    ...formData.seo_metadata,
                    og_image: primaryImage.image_url
                }
            });
        }
    };

    const handleAddRedirect = async () => {
        if (!articleId) {
            onNotify('error', 'Vui lòng lưu bài viết trước khi thêm redirect.');
            return;
        }
        if (!newRedirectSlug.trim()) {
            return;
        }

        try {
            setAddingRedirect(true);
            await articleService.addRedirect(articleId, newRedirectSlug);
            onNotify('success', 'Đã thêm redirect.');
            setNewRedirectSlug('');
            // Optimistic update
            if (onRedirectsChange) {
                const newRedirect: ArticleSeoRedirect = {
                    id: 'temp-' + Date.now(),
                    article_id: articleId,
                    from_slug: newRedirectSlug,
                    to_slug: formData.slug || '',
                    created_at: new Date().toISOString()
                };
                onRedirectsChange([...redirects, newRedirect]);
            }
        } catch (error: any) {
            onNotify('error', error.response?.data?.error || 'Không thể thêm redirect.');
        } finally {
            setAddingRedirect(false);
        }
    };

    const handleDeleteRedirect = async (redirectId: string) => {
        if (!articleId) return;
        if (!confirm('Bạn có chắc muốn xóa redirect này?')) return;

        try {
            await articleService.deleteRedirect(articleId, redirectId);
            onNotify('success', 'Đã xóa redirect.');
            if (onRedirectsChange) {
                onRedirectsChange(redirects.filter(r => r.id !== redirectId));
            }
        } catch (error: any) {
            onNotify('error', 'Không thể xóa redirect.');
        }
    };

    const handleAutoFill = () => {
        // 1. Validation: valid Title is required
        if (!formData.title?.trim()) {
            onNotify('error', 'Vui lòng nhập tiêu đề bài viết trước khi tự động tạo SEO Metadata.');
            return;
        }

        // 2. Check for existing data & Confirmation Logic
        const hasExistingData = formData.seo_metadata?.meta_title ||
            formData.seo_metadata?.meta_description ||
            formData.seo_metadata?.og_image;

        if (hasExistingData && !confirmOverwrite) {
            setConfirmOverwrite(true);
            onNotify('error', 'Dữ liệu SEO đã tồn tại. Nhấn nút Auto-fill một lần nữa để xác nhận ghi đè.');

            // Reset confirmation state after 3 seconds
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => {
                setConfirmOverwrite(false);
            }, 5000) as unknown as NodeJS.Timeout; // Type assertion fix

            return;
        }

        // Reset confirm state if proceed
        setConfirmOverwrite(false);
        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);

        const title = formData.title;
        const summary = formData.summary || (formData.content ? formData.content.substring(0, 160) + '...' : '');
        const keywords = formData.tags?.map(t => t.name).join(', ') || '';

        // Simple slugify
        const slug = title.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");

        // Primary Image
        const primaryImage = formData.images?.find(img => img.is_primary);
        let ogImage = primaryImage?.image_url || '';

        // Check if primary image is unsaved (has data but no url)
        // No error notification - Backend will handle it on save

        // 3. Update State (Overwrite is assumed true if we passed the check above)
        onFormDataChange({
            slug: formData.slug || slug,
            seo_metadata: {
                ...formData.seo_metadata,
                meta_title: title,
                meta_description: summary,
                meta_keywords: keywords,
                canonical_url: slug ? `/articles/${slug}` : '',
                og_image: ogImage || formData.seo_metadata?.og_image, // Only overwrite if we found a valid new image, otherwise keep old
            }
        });

        onNotify('success', 'Đã tự động điền thông tin SEO.');
    };

    return (
        <div className="lg:col-span-4 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-base">Hình ảnh</h3>
                <ImageGallery
                    images={formData.images || []}
                    onImagesChange={(images) => onFormDataChange({ images })}
                    onImageInsert={onImageInsert}
                    onImageRemove={onImageRemove}
                />
            </div>

            {/* Tags */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-base">Tags</h3>
                <TagSelector
                    selectedTags={formData.tags || []}
                    onTagsChange={(tags) => onFormDataChange({ tags })}
                />
            </div>

            {/* Related Articles */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-base">Bài viết liên quan</h3>
                <RelatedArticleSelector
                    selectedArticleIds={formData.related_article_ids || []}
                    onRelatedArticlesChange={(ids) => onFormDataChange({ related_article_ids: ids })}
                    currentArticleId={articleId}
                />
            </div>

            {/* SEO Metadata & Preview */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={onToggleSeoSection}
                >
                    <h3 className="font-bold text-gray-900 text-base">SEO Metadata</h3>
                    <div className="flex items-center space-x-2">
                        {showSeoSection && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAutoFill();
                                }}
                                className={`text-xs px-2 py-1 rounded flex items-center transition-all ${confirmOverwrite
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ring-2 ring-yellow-400'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                                title={confirmOverwrite ? "Nhấn lần nữa để ghi đè dữ liệu cũ" : "Tự động điền metadata từ nội dung bài viết"}
                            >
                                <HiLightningBolt className={`w-3 h-3 mr-1 ${confirmOverwrite ? 'animate-pulse' : ''}`} />
                                {confirmOverwrite ? 'Xác nhận ghi đè?' : 'Auto-fill'}
                            </button>
                        )}
                        {showSeoSection ? (
                            <HiChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                            <HiChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                </div>
                {showSeoSection && (
                    <div className="mt-4 space-y-4">
                        {/* Preview */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Google Search Preview</label>
                            <SeoPreview
                                title={formData.seo_metadata?.meta_title || formData.title}
                                description={formData.seo_metadata?.meta_description || formData.summary || ''}
                                slug={formData.slug || ''}
                                siteName="Library AI DTI"
                            />
                        </div>

                        <hr className="border-gray-100" />

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-700">
                                <span className="font-semibold">Mẹo:</span> Bạn có thể để trống các trường bên dưới. Hệ thống sẽ tự động tạo thông tin chuẩn SEO từ nội dung bài viết khi bạn lưu.
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
                            <input
                                type="text"
                                value={formData.seo_metadata?.meta_title || ''}
                                onChange={(e) => onFormDataChange({
                                    seo_metadata: { ...formData.seo_metadata, meta_title: e.target.value }
                                })}
                                placeholder="Để trống để lấy tự động từ Tiêu đề bài viết..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
                            <textarea
                                value={formData.seo_metadata?.meta_description || ''}
                                onChange={(e) => onFormDataChange({
                                    seo_metadata: { ...formData.seo_metadata, meta_description: e.target.value }
                                })}
                                placeholder="Để trống để lấy tự động từ Tóm tắt hoặc Nội dung..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Meta Keywords</label>
                            <input
                                type="text"
                                value={formData.seo_metadata?.meta_keywords || ''}
                                onChange={(e) => onFormDataChange({
                                    seo_metadata: { ...formData.seo_metadata, meta_keywords: e.target.value }
                                })}
                                placeholder="Để trống để lấy tự động từ Tags..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">OG Image URL</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={formData.seo_metadata?.og_image || ''}
                                    onChange={(e) => onFormDataChange({
                                        seo_metadata: { ...formData.seo_metadata, og_image: e.target.value }
                                    })}
                                    placeholder="Để trống để lấy tự động từ ảnh đại diện..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleUsePrimaryImage}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Sử dụng ảnh đại diện bài viết"
                                >
                                    <HiPhotograph className="w-5 h-5" />
                                </button>
                            </div>
                            {!formData.seo_metadata?.og_image && formData.images?.some(img => img.is_primary && !img.image_url) && (
                                <p className="text-xs text-orange-500 mt-1 italic">
                                    * Ảnh đại diện sẽ tự động cập nhật sau khi lưu bài viết.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Canonical URL</label>
                            <input
                                type="text"
                                value={formData.seo_metadata?.canonical_url || ''}
                                onChange={(e) => onFormDataChange({
                                    seo_metadata: { ...formData.seo_metadata, canonical_url: e.target.value }
                                })}
                                placeholder="Để trống để tự động tạo từ Slug..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Redirects Section */}
            {articleId && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 text-base">Quản lý Alias (Link phụ)</h3>
                    <p className="text-xs text-gray-500 mb-3">Các đường dẫn này sẽ tự động chuyển hướng về bài viết hiện tại.</p>

                    <div className="space-y-2 mb-4">
                        {redirects && redirects.length > 0 ? redirects.map((r) => (
                            <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded border border-gray-200">
                                <span className="flex items-center text-gray-600 truncate mr-2" title={`/${r.from_slug}`}>
                                    <HiExternalLink className="w-4 h-4 mr-1 text-gray-400" />
                                    /{r.from_slug}
                                </span>
                                <button
                                    onClick={() => handleDeleteRedirect(r.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                    title="Xóa alias"
                                >
                                    <HiTrash className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <p className="text-xs text-gray-400 italic">Chưa có alias nào.</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newRedirectSlug}
                            onChange={(e) => {
                                let val = e.target.value;
                                if (val.includes('http') || val.includes('://')) {
                                    try {
                                        const url = new URL(val);
                                        val = url.pathname.replace(/^\/|\/$/g, '');
                                    } catch (err) { }
                                }
                                const slugified = val.toLowerCase()
                                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                    .replace(/đ/g, "d")
                                    .replace(/[^a-z0-9\s-]/g, "")
                                    .replace(/\s+/g, "-");
                                setNewRedirectSlug(slugified);
                            }}
                            placeholder="Nhập link phụ (alias) hoặc dán link đầy đủ..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddRedirect()}
                        />
                        <button
                            type="button"
                            onClick={handleAddRedirect}
                            disabled={addingRedirect}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                            {addingRedirect ? '...' : <HiPlus className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Settings */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-5">
                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-base">Cấu hình bài viết</h3>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                        <option value="DRAFT">Bản nháp</option>
                        <option value="REVIEW">Chờ duyệt</option>
                        <option value="PUBLISHED">Đã đăng</option>
                    </select>
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
                    <CategorySelector
                        selectedCategoryId={formData.category_id || ''}
                        onCategoryChange={(id) => onFormDataChange({ category_id: id })}
                    />
                </div>

                {/* Featured Toggle */}
                <div className="pt-2 border-t border-gray-100">
                    <div
                        className="flex items-start cursor-pointer group"
                        onClick={onToggleFeatured}
                    >
                        <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.is_featured ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_featured ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </div>
                        <div className="ml-3 select-none">
                            <span className="block text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Bài viết nổi bật</span>
                            <span className="block text-xs text-gray-500">Ghim bài viết này lên đầu trang chủ tin tức.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticleEditorSidebar;
