import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiExclamationCircle, HiX, HiCheck } from 'react-icons/hi';
import { articleService, Article, ArticleInput } from '@/services/article.service';
import { categoryService, Category } from '@/services/category.service';
import { tagService, Tag } from '@/services/tag.service';
import ArticleEditorHeader from './ArticleEditorHeader';
import ArticleEditorSidebar from './ArticleEditorSidebar';

interface ArticleEditorProps {
    articleId?: string;
    initialData?: Article | null;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleId, initialData }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSeoSection, setShowSeoSection] = useState(false);

    const [formData, setFormData] = useState<ArticleInput>({
        title: '',
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
    });

    // Load categories and tags
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesData, tagsData] = await Promise.all([
                    categoryService.getAll(),
                    tagService.getAll()
                ]);
                setCategories(categoriesData);
                setAvailableTags(tagsData);
            } catch (error) {
                console.error("Failed to load data", error);
                setError("Không thể tải dữ liệu");
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                content: initialData.content,
                summary: initialData.summary || '',
                status: initialData.status,
                category_id: initialData.category_id || '',
                is_featured: initialData.is_featured,
                images: initialData.images?.map(img => ({
                    image_url: img.image_url,
                    is_primary: img.is_primary
                })) || [],
                tags: (initialData as any).tags || [],
                seo_metadata: (initialData as any).seo_metadata || {
                    meta_title: '',
                    meta_description: '',
                    meta_keywords: '',
                    og_image: '',
                    canonical_url: '',
                },
            });
        }
    }, [initialData]);

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

            // Delay redirect to allow user to see the success message
            setTimeout(() => {
                router.push('/admin/articles');
            }, 2000);
        } catch (error: any) {
            console.error("Failed to save article", error);
            setError(error.response?.data?.error || "Có lỗi xảy ra khi lưu bài viết.");
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            <ArticleEditorHeader
                articleId={articleId}
                loading={loading}
                completion={completion}
                activeStep={activeStep}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/admin/articles')}
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase">Nội dung chi tiết</span>
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Markdown Supported</span>
                            </div>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Viết nội dung bài viết của bạn tại đây..."
                                className="flex-1 w-full p-6 border-none focus:ring-0 resize-none text-base leading-relaxed text-gray-800 font-article"
                            />
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <ArticleEditorSidebar
                        formData={formData}
                        categories={categories}
                        availableTags={availableTags}
                        showSeoSection={showSeoSection}
                        onFormDataChange={handleFormDataChange}
                        onToggleFeatured={handleToggleFeatured}
                        onToggleSeoSection={() => setShowSeoSection(!showSeoSection)}
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
