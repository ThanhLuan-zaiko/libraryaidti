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
import ArticleGallery from '@/components/article/ArticleGallery';
import CommentSection from '@/components/comments/CommentSection'; // Added import

export default function ArticleDetail() {
    const { slug } = useParams();
    const [article, setArticle] = useState<Article | null>(null);
    const [related, setRelated] = useState<Article[]>([]);
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
            let labelText = cleanText.split(/[.!?:]/)[0];
            if (labelText.length > 50) labelText = labelText.substring(0, 47) + '...';
            if (labelText.length < 5 && cleanText.length > 10) labelText = cleanText.substring(0, 50) + '...';

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

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const data = await articleService.getById(slug as string);
                setArticle(data);

                if (data.category_id) {
                    const relatedRes = await articleService.getList({
                        page: 1,
                        limit: 4,
                        category_id: data.category_id,
                        status: 'PUBLISHED'
                    });
                    setRelated(relatedRes.data.filter(a => a.id !== data.id));
                }
            } catch (error) {
                console.error('Error fetching article:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchArticle();
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
    if (!article) return <ArticleNotFound />;

    const formattedDate = article.published_at
        ? format(new Date(article.published_at), 'dd MMMM, yyyy', { locale: vi })
        : format(new Date(article.created_at), 'dd MMMM, yyyy', { locale: vi });

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
                        <ArticleAuthor article={article} />
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

            {/* Bottom Recommendation Section */}
            <RelatedArticles related={related} />
        </div>
    );
}
