'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { articleService, Article } from '@/services/article.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { HiCheck } from 'react-icons/hi';

// Extracted Components
import { ArticleLoading, ArticleNotFound } from '@/components/article/ArticleStatus';
import ArticleHero from '@/components/article/ArticleHero';
import ArticleContent from '@/components/article/ArticleContent';
import ArticleSidebar from '@/components/article/ArticleSidebar';
import ArticleAuthor from '@/components/article/ArticleAuthor';
import RelatedArticles from '@/components/article/RelatedArticles';
import CategoryDiscovery from '@/components/article/CategoryDiscovery';
import ArticleGallery from '@/components/article/ArticleGallery';
import CommentSection from '@/components/comments/CommentSection';
import StarRating from '@/components/article/StarRating';
import { useViewTracking } from '@/hooks/useViewTracking';

export default function ArticleDetail() {
    const { slug } = useParams();

    const [article, setArticle] = useState<Article | null>(null);

    // Track view after 30 seconds - Use canonical slug from loaded article
    useViewTracking(article?.slug);
    const [related, setRelated] = useState<Article[]>([]);
    const [categoryArticles, setCategoryArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [readingProgress, setReadingProgress] = useState(0);
    const [showCopied, setShowCopied] = useState(false);

    // TOC Extraction & ID Injection
    const [processedContent, setProcessedContent] = useState('');
    const [toc, setToc] = useState<any[]>([]);

    useEffect(() => {
        if (!article || !article.content) return;

        // Smart Paragraph-based Extraction
        const rawContent = article.content;
        // Split by newlines (single or multiple)
        const paragraphs = rawContent.split(/\n+/).map(p => p.trim()).filter(p => p.length > 5);

        const extractedToc: any[] = [];
        let htmlContent = '';

        paragraphs.forEach((p, index) => {
            const id = `section-${index}`;
            const cleanText = p.replace(/^- /g, '').trim(); // Remove leading hyphens if any

            // Create a label: first sentence or first 50 chars
            let labelText = cleanText;
            const isImage = /^!\[.*\]\(.*\)$/.test(cleanText);

            if (!isImage) {
                labelText = cleanText.split(/[.!?:]/)[0];
                if (labelText.length > 50) labelText = labelText.substring(0, 47) + '...';
                if (labelText.length < 5 && cleanText.length > 10) labelText = cleanText.substring(0, 50) + '...';
            }

            extractedToc.push({
                id,
                label: labelText,
                level: 2 // Treat all top-level paragraphs as H2 level for TOC
            });

            // Re-wrap in styled divs with IDs
            htmlContent += `<div id="${id}" class="article-section mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">${p}</div>`;
        });

        setProcessedContent(htmlContent || rawContent.replace(/\n/g, '<br/>'));
        setToc(extractedToc);
    }, [article?.content]);

    const [error, setError] = useState<{ code?: number; message?: string } | null>(null);

    useEffect(() => {
        let isCurrent = true;
        const controller = new AbortController();

        const fetchArticle = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await articleService.getById(slug as string, controller.signal);

                if (!isCurrent) return;

                if (!data) {
                    setArticle(null);
                    setLoading(false);
                    return;
                }

                setArticle(data);

                // Fetch data for two separate sections:
                // 1. Explicit Related (Inline)
                if (data.related_articles && data.related_articles.length > 0) {
                    setRelated(data.related_articles.slice(0, 12));
                } else if (data.category_id) {
                    // Fallback for inline if no explicit links
                    const relatedRes = await articleService.getList({
                        page: 1, limit: 4, category_id: data.category_id, status: 'PUBLISHED'
                    }, controller.signal);
                    if (isCurrent) setRelated(relatedRes.data.filter(a => a.id !== data.id));
                }

                if (isCurrent) setLoading(false);
            } catch (err: any) {
                if (err.name === 'CanceledError' || err.name === 'AbortError') return;

                if (isCurrent) {
                    const status = err.response?.status;
                    setError({
                        code: status,
                        message: status === 429 ? 'Hệ thống đang bận do có quá nhiều yêu cầu. Vui lòng chờ vài giây rồi thử lại.' : 'Đã có lỗi xảy ra khi tải bài viết.'
                    });
                    setLoading(false);
                }
            }
        };

        if (slug) fetchArticle();

        return () => {
            isCurrent = false;
            controller.abort();
        };
    }, [slug]);

    useEffect(() => {
        const handleScroll = () => {
            const element = document.documentElement;
            const scrollHeight = element.scrollHeight - element.clientHeight;
            const scrollTop = element.scrollTop;
            const progress = (scrollTop / scrollHeight) * 100;
            setReadingProgress(progress);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading) return <ArticleLoading />;

    if (error) {
        return (
            <div className="container mx-auto px-6 py-40 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-50 text-amber-500 mb-8 shadow-inner">
                    <span className="text-4xl">⏳</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">{error.code === 429 ? 'Quá nhiều yêu cầu' : 'Đã có lỗi xảy ra'}</h2>
                <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium">{error.message}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200"
                >
                    Tải lại trang
                </button>
            </div>
        );
    }

    if (!article) return <ArticleNotFound />;

    const getDateString = () => {
        const dateStr = article.published_at || article.created_at;
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? '' : format(date, 'dd MMMM, yyyy', { locale: vi });
    };

    const formattedDate = getDateString();

    const readTime = Math.max(1, Math.ceil((article.content?.split(/\s+/).length || 0) / 200));


    return (
        <div className="bg-[#FFFFFF] min-h-screen selection:bg-blue-600 selection:text-white font-sans text-gray-900 overflow-x-clip">
            {/* Ultra-Precision Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-[4px] z-[100] bg-gray-50">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.7)] transition-all duration-500 ease-out"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            {/* Global Toast Notification */}
            <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ${showCopied ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <HiCheck className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-blue-400">Linked Copied</span>
                </div>
            </div>

            {/* Cinematic Hero Header */}
            <ArticleHero article={article} formattedDate={formattedDate} readTime={readTime} />

            {/* Immersive Wide Gallery Section */}
            <div className="container mx-auto max-w-[1600px] px-6 mt-20">
                <ArticleGallery images={article.images} />
            </div>

            {/* Strategic Layout Structure */}
            <main className="container mx-auto max-w-7xl px-6 py-20 lg:py-32 relative">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24">

                    <div className="lg:col-span-8 flex flex-col space-y-16">
                        <ArticleContent
                            article={article}
                            content={processedContent}
                            onCopyLink={() => {
                                setShowCopied(true);
                                setTimeout(() => setShowCopied(false), 3000);
                            }}
                        />
                        <StarRating
                            articleId={article.id}
                            initialAvg={article.rating_avg}
                            initialCount={article.rating_count}
                        />
                        <ArticleAuthor article={article} />
                        <RelatedArticles
                            initialRelated={related}
                            categoryId={article.category_id}
                            currentArticleId={article.id}
                        />
                        <CommentSection articleId={article.id} />
                    </div>

                    {/* Sidebar Column */}
                    <ArticleSidebar
                        article={article}
                        toc={toc}
                        readingProgress={readingProgress}
                        showCopied={showCopied}
                        onShare={async () => {
                            await navigator.clipboard.writeText(window.location.href);
                            setShowCopied(true);
                            setTimeout(() => setShowCopied(false), 3000);
                        }}
                    />
                </div>
            </main>

            {article?.category_id && (
                <CategoryDiscovery
                    initialArticles={categoryArticles}
                    categoryId={article.category_id}
                    currentArticleId={article.id}
                    categoryName={article.category?.name}
                />
            )}
        </div>
    );
}
