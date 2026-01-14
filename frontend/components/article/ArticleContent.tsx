'use client';

import React from 'react';
import { FaQuoteLeft, FaFacebook, FaTwitter, FaLinkedin, FaLink } from 'react-icons/fa';
import { Article } from '@/services/article.service';

interface ArticleContentProps {
    article: Article;
    content?: string;
    onCopyLink?: () => void;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ article, content, onCopyLink }) => {
    return (
        <article className="lg:col-span-8 flex flex-col space-y-16">
            {/* Grand Abstract Card */}
            <div className="relative group p-6 md:p-12 lg:p-20 bg-gray-50 rounded-[2rem] md:rounded-[4rem] border border-gray-100 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden transition-all hover:bg-white hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-600/5 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:scale-150 transition-transform" />
                <FaQuoteLeft className="text-blue-100/40 text-[12rem] absolute -top-8 -left-8 -rotate-12 transition-transform group-hover:rotate-0" />
                <p className="relative z-10 text-2xl md:text-4xl font-black text-gray-900 leading-[1.4] tracking-tight italic">
                    {article.summary}
                </p>
            </div>

            {/* High-Performance Article Body */}
            <div
                className="article-body max-w-full break-words overflow-hidden
                    text-xl md:text-2xl leading-[1.8] text-gray-800 font-normal tracking-tight
                    [&>p]:mb-12 [&>p]:font-medium [&>p]:text-gray-700
                    [&>h2]:text-4xl [&>h2]:md:text-6xl [&>h2]:font-black [&>h2]:text-gray-950 [&>h2]:mt-24 [&>h2]:mb-10 [&>h2]:tracking-tighter [&>h2]:leading-[1.1]
                    [&>h3]:text-3xl [&>h3]:md:text-4xl [&>h3]:font-black [&>h3]:text-gray-900 [&>h3]:mt-16 [&>h3]:mb-8 [&>h3]:tracking-tight
                    [&>blockquote]:border-l-[10px] [&>blockquote]:border-blue-600 [&>blockquote]:bg-gray-50 [&>blockquote]:p-12 [&>blockquote]:md:p-20 [&>blockquote]:my-20 [&>blockquote]:rounded-[3rem] [&>blockquote]:text-3xl [&>blockquote]:md:text-4xl [&>blockquote]:font-black [&>blockquote]:italic [&>blockquote]:text-gray-900 [&>blockquote]:shadow-inner
                    [&>img]:rounded-[3rem] [&>img]:my-20 [&>img]:shadow-3xl [&>img]:w-full [&>img]:object-cover [&>img]:border-4 [&>img]:border-white
                    [&>ul]:my-10 [&>ul]:list-none [&>ul]:pl-0 [&>ul]:space-y-6
                    [&>ol]:my-10 [&>ol]:list-decimal [&>ol]:pl-12 [&>ol]:space-y-6 [&>ol]:font-black [&>ol]:text-gray-900
                    [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-8 [&_a]:decoration-4 [&_a]:decoration-blue-100 [&_a]:hover:decoration-blue-600 [&_a]:transition-all
                    [&_li]:text-gray-600 [&_li]:font-medium [&_li]:pl-4 [&_li]:border-l-2 [&_li]:border-blue-50 hover:[&_li]:border-blue-600
                    [&>hr]:my-20 [&>hr]:border-gray-200"
                dangerouslySetInnerHTML={{ __html: content || article.content }}
            />

            {/* Article Maturity / Engagement Footer */}
            <div className="pt-20 mt-28 border-t-2 border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mr-6">Knowledge Graph</span>
                    {(article.tags && article.tags.length > 0 ? article.tags.map(t => t.name) : ['Perspective', 'Innovation', 'Insight']).map(tag => (
                        <span key={tag} className="px-6 py-3 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-blue-600 transition-all cursor-pointer shadow-lg transform hover:-translate-y-1">
                            #{tag.toUpperCase()}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-8">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Network Share</span>
                    <div className="flex gap-4">
                        {[
                            {
                                Icon: FaFacebook,
                                color: 'hover:bg-blue-600',
                                label: 'Facebook',
                                onClick: () => {
                                    const url = window.location.href;
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
                                }
                            },
                            {
                                Icon: FaTwitter,
                                color: 'hover:bg-black',
                                label: 'X (Twitter)',
                                onClick: () => {
                                    const url = window.location.href;
                                    const text = article.title;
                                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                                }
                            },
                            {
                                Icon: FaLinkedin,
                                color: 'hover:bg-blue-700',
                                label: 'LinkedIn',
                                onClick: () => {
                                    const url = window.location.href;
                                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
                                }
                            }
                        ].map(({ Icon, color, onClick, label }, i) => (
                            <button
                                key={i}
                                onClick={onClick}
                                title={`Chia sẻ qua ${label}`}
                                className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-500 border border-transparent shadow-sm ${color} hover:text-white hover:shadow-xl transition-all transform hover:-translate-y-1`}
                            >
                                <Icon className="w-6 h-6" />
                            </button>
                        ))}

                        <div className="w-px h-14 bg-gray-100 mx-1" />

                        <button
                            onClick={async () => {
                                await navigator.clipboard.writeText(window.location.href);
                                if (onCopyLink) onCopyLink();
                            }}
                            title="Sao chép liên kết"
                            className="group w-14 h-14 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            <FaLink className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default ArticleContent;
