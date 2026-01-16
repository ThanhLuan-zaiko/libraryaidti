import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiExclamationCircle, HiX, HiCheck } from 'react-icons/hi';
import { articleService, Article, ArticleInput, ArticleSeoRedirect } from '@/services/article.service';
import { categoryService, Category } from '@/services/category.service';
import { tagService, Tag } from '@/services/tag.service';
import ArticleEditorHeader from './ArticleEditorHeader';
import ArticleEditorSidebar from './ArticleEditorSidebar';
import MarkdownEditor, { MarkdownEditorRef } from './MarkdownEditor';
import { getImageUrl } from '@/utils/image';
import ConfirmModal from '@/components/common/ConfirmModal';

interface ArticleEditorProps {
    articleId?: string;
    initialData?: Article | null;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleId, initialData }) => {
    const router = useRouter();
    const editorRef = React.useRef<MarkdownEditorRef>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSeoSection, setShowSeoSection] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [formData, setFormData] = useState<ArticleInput>({
        title: '',
        slug: '',
        content: '',
        summary: '',
        status: 'DRAFT',
        category_id: '',
        is_featured: false,
        images: [],
        tags: [],
        seo_metadata: {
            meta_title: '',
            meta_description: '',
            meta_keywords: '',
            og_image: '',
            canonical_url: '',
        },
        related_article_ids: [],
    });

    const [redirects, setRedirects] = useState<ArticleSeoRedirect[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [initialFormData, setInitialFormData] = useState<ArticleInput | null>(null);

    useEffect(() => {
        if (initialData) {
            const mappedImages = initialData.images?.map((img, i) => ({
                local_id: `image-existing-${i}`,
                image_url: img.image_url,
                description: img.description,
                is_primary: img.is_primary
            })) || [];

            const initial: ArticleInput = {
                title: initialData.title || '',
                slug: initialData.slug || '',
                content: initialData.content || '',
                summary: initialData.summary || '',
                status: initialData.status || 'DRAFT',
                category_id: initialData.category_id || '',
                is_featured: !!initialData.is_featured,
                images: mappedImages,
                tags: (initialData as any).tags || [],
                seo_metadata: (initialData as any).seo_metadata || {
                    meta_title: '',
                    meta_description: '',
                    meta_keywords: '',
                    og_image: '',
                    canonical_url: '',
                },
                related_article_ids: Array.from(new Set((initialData as any).related_articles?.map((a: Article) => a.id) || [])) as string[],
            };

            setRedirects(initialData.redirects || []);
            setFormData(initial);
            setInitialFormData(initial);
            setIsDirty(false);
        } else if (!initialFormData) {
            // Set initial blank state for new articles
            setInitialFormData(formData);
        }
    }, [initialData]);

    // Handle beforeunload to warn user about unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Standard way to show browser confirmation
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Deep compare formData with initialFormData to set isDirty
    useEffect(() => {
        if (!initialFormData) return;

        // Simple but effective dirty check for this form structure
        // We exclude transient state like files or local image_data from the comparison
        const stripTransient = (data: ArticleInput) => ({
            ...data,
            images: data.images?.map(i => ({ ...i, file: undefined, image_data: undefined }))
        });

        const currentStr = JSON.stringify(stripTransient(formData));
        const initialStr = JSON.stringify(stripTransient(initialFormData));

        if (currentStr !== initialStr) {
            setIsDirty(true);
        } else {
            setIsDirty(false);
        }
    }, [formData, initialFormData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleFormDataChange = (data: Partial<ArticleInput>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleToggleFeatured = () => {
        setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validate all required fields
        const completion = getFormCompletion();
        if (completion.completed < completion.total) {
            const missingFields = Object.entries(completion.fields)
                .filter(([_, completed]) => !completed)
                .map(([field]) => {
                    const names: Record<string, string> = {
                        title: 'Tiêu đề',
                        content: 'Nội dung',
                        summary: 'Tóm tắt',
                        category: 'Danh mục',
                        images: 'Hình ảnh',
                        tags: 'Tags'
                    };
                    return names[field] || field;
                });

            setError(`Vui lòng hoàn thiện các trường sau: ${missingFields.join(', ')}`);
            // Scroll to top to see error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (articleId) {
                await articleService.update(articleId, formData);
                setSuccess("Bài viết đã được cập nhật thành công!");
            } else {
                await articleService.create(formData);
                setSuccess("Bài viết đã được tạo thành công!");
            }

            // Update initial state to represent current saved state (reset dirty)
            setInitialFormData(formData);
            setIsDirty(false);

            // Delay redirect to allow user to see the success message
            setTimeout(() => {
                router.push('/admin/articles');
            }, 2000);
        } catch (error: any) {
            console.error("Failed to save article", error);
            // Handle new backend error structure: { success: false, error: { code: 400, message: "..." } }
            // OR fallback to old simple { error: "..." } if any endpoints still use it
            const msg = error.response?.data?.error?.message || error.response?.data?.error || "Có lỗi xảy ra khi lưu bài viết.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Calculate form completion
    const getFormCompletion = () => {
        const fieldStates = {
            title: !!formData.title,
            content: !!formData.content,
            summary: !!formData.summary,
            category: !!formData.category_id,
            images: !!(formData.images && formData.images.length > 0),
            tags: !!(formData.tags && formData.tags.length > 0),
        };

        const fields = Object.values(fieldStates);
        const completed = fields.filter(Boolean).length;
        const total = fields.length;

        return {
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
            fields: fieldStates
        };
    };

    const getActiveStep = () => {
        switch (formData.status) {
            case 'DRAFT': return 1;
            case 'REVIEW': return 2;
            case 'PUBLISHED': return 3;
            default: return 1;
        }
    };

    const completion = getFormCompletion();
    const activeStep = getActiveStep();

    const handleCancel = () => {
        if (isDirty) {
            setShowConfirmModal(true);
        } else {
            router.push('/admin/articles');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            <ArticleEditorHeader
                articleId={articleId}
                loading={loading}
                completion={completion}
                activeStep={activeStep}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />

            {/* Confirm Unsaved Changes Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Bỏ dở việc soạn thảo?"
                message="Bạn có các thay đổi chưa được lưu. Nếu rời đi bây giờ, những nội dung mới nhất sẽ bị mất vĩnh viễn."
                confirmText="Rời khỏi trang"
                cancelText="Tiếp tục soạn"
                onConfirm={() => {
                    setShowConfirmModal(false);
                    // Reset dirty state to allow navigation
                    setIsDirty(false);
                    router.push('/admin/articles');
                }}
                onCancel={() => setShowConfirmModal(false)}
            />

            {/* Success Notification */}
            {success && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-shrink-0">
                            <div className="bg-emerald-100 p-1 rounded-full">
                                <HiCheck className="h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-emerald-800">Thành công</h3>
                            <div className="mt-1 text-sm text-emerald-700 font-medium">{success}</div>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setSuccess(null)}
                                className="-mx-1.5 -my-1.5 bg-emerald-50 p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-100 focus:outline-none transition-colors"
                            >
                                <HiX className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Notification */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start">
                        <div className="flex-shrink-0">
                            <HiExclamationCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Đã xảy ra lỗi</h3>
                            <div className="mt-1 text-sm text-red-700">{error}</div>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setError(null)}
                                className="-mx-1.5 -my-1.5 bg-red-50 p-1.5 rounded-lg text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <span className="sr-only">Dismiss</span>
                                <HiX className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Editor (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Title & Summary */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề bài viết</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Nhập tiêu đề hấp dẫn..."
                                    className="w-full px-0 py-2 text-3xl font-bold text-gray-900 placeholder-gray-300 border-none border-b-2 border-transparent focus:border-blue-500 focus:ring-0 transition-all bg-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tóm tắt ngắn</label>
                                <textarea
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Mô tả ngắn gọn về nội dung (hiển thị trên danh sách tin tức)..."
                                    className="w-full text-base text-gray-600 placeholder-gray-400 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex flex-col min-h-[600px]">
                            <MarkdownEditor
                                ref={editorRef}
                                value={formData.content}
                                images={formData.images || []}
                                onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                                placeholder="Viết nội dung bài viết của bạn tại đây..."
                                minHeight="600px"
                            />
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <ArticleEditorSidebar
                        formData={formData}
                        articleId={articleId}
                        redirects={redirects}
                        showSeoSection={showSeoSection}
                        onFormDataChange={handleFormDataChange}
                        onToggleFeatured={handleToggleFeatured}
                        onToggleSeoSection={() => setShowSeoSection(!showSeoSection)}
                        onRedirectsChange={setRedirects}
                        onImageInsert={(id, desc, idx) => {
                            if (editorRef.current) {
                                // Design a more readable placeholder: ![Ảnh 1: [Mô tả]](image-ref-id)
                                const label = desc ? `Ảnh ${idx}: ${desc}` : `Ảnh ${idx}`;
                                const md = `\n![${label}](${id})\n`;
                                const success = editorRef.current.insertText(md);
                                if (!success) {
                                    setError("Vui lòng chuyển sang chế độ 'Soạn thảo' hoặc 'Song song' để chèn ảnh.");
                                }
                                return success;
                            }
                            return false;
                        }}
                        onImageRemove={(image) => {
                            if (!image) return;

                            let newContent = formData.content;
                            const idsToRemove = [image.local_id, image.image_url].filter(Boolean) as string[];

                            if (idsToRemove.length === 0) return;

                            idsToRemove.forEach(id => {
                                // Create regex to find Markdown image pattern regardless of alt text
                                // Matches: ![any text](id) or ![any text](server-url)
                                const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(`\\n?!\\[.*?\\]\\(${escapedId}\\)\\n?`, 'g');
                                newContent = newContent.replace(regex, '\n');
                            });

                            if (newContent !== formData.content) {
                                setFormData(prev => ({ ...prev, content: newContent.trim() }));
                            }
                        }}
                        onNotify={(type, msg) => {
                            if (type === 'error') setError(msg);
                            else setSuccess(msg);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ArticleEditor;
