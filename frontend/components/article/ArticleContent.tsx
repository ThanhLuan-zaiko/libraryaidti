import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FaQuoteLeft, FaFacebook, FaTwitter, FaLinkedin, FaLink } from 'react-icons/fa';
import { Article } from '@/services/article.service';
import { getImageUrl } from '@/utils/image';

interface ArticleContentProps {
    article: Article;
    content?: string;
    onCopyLink?: () => void;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ article, content, onCopyLink }) => {
    const rawContent = content || article.content || '';
    const images = article.images || [];

    // Pre-process content: Convert Markdown images inside HTML blocks to HTML <img> tags
    // This is needed because CommonMark specs ignore Markdown parsing inside block-level HTML tags (like <div...>)
    const processContent = (text: string) => {
        // Regex to match ![alt](url)
        return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            return `<img src="${src}" alt="${alt}" />`;
        });
    };

    const displayContent = processContent(rawContent);

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
            <div className="article-body max-w-full break-words overflow-hidden">
                <div className="prose prose-lg md:prose-xl max-w-none
                    prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-gray-900
                    prose-h2:text-4xl prose-h2:md:text-6xl prose-h2:mt-24 prose-h2:mb-10
                    prose-h3:text-3xl prose-h3:md:text-4xl prose-h3:mt-16 prose-h3:mb-8
                    prose-p:text-xl prose-p:md:text-2xl prose-p:leading-[1.8] prose-p:text-gray-800 prose-p:font-normal prose-p:mb-12
                    prose-a:text-blue-600 prose-a:no-underline prose-a:border-b-4 prose-a:border-blue-100 hover:prose-a:border-blue-600 prose-a:transition-all
                    prose-blockquote:border-l-[10px] prose-blockquote:border-blue-600 prose-blockquote:bg-gray-50 prose-blockquote:p-12 prose-blockquote:rounded-[3rem] prose-blockquote:text-3xl prose-blockquote:font-black prose-blockquote:italic prose-blockquote:text-gray-900 prose-blockquote:not-italic prose-blockquote:shadow-inner prose-blockquote:my-20
                    prose-img:rounded-[3rem] prose-img:shadow-3xl prose-img:border-4 prose-img:border-white prose-img:w-full prose-img:object-cover prose-img:my-20
                    prose-li:text-xl prose-li:text-gray-600 prose-li:marker:text-blue-600
                    [&>ul]:list-disc [&>ul]:pl-8 [&>ul]:space-y-4
                    [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:space-y-4
                ">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            img: ({ src, alt, ...props }) => {
                                if (!src || src === '') return null;

                                // Try to find the image in the article images by URL
                                const findMatch = (img: any) =>
                                    (img.image_url && (img.image_url === src || getImageUrl(img.image_url) === src));

                                const refImage = images.find(findMatch);

                                // "Smart Order": Labels match visual sorting (Primary first)
                                const sortedImages = [...images].sort((a, b) =>
                                    (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1)
                                );
                                const visualIndex = sortedImages.findIndex(findMatch);

                                const finalSrc = getImageUrl(typeof src === 'string' ? src : undefined);

                                if (!finalSrc || finalSrc === '') return null;

                                // Dynamic label from database description or alt text
                                let dynamicAlt = alt;
                                if (refImage && visualIndex !== -1) {
                                    const label = refImage.description || '';
                                    dynamicAlt = label;
                                }

                                return (
                                    <span className="block my-20">
                                        <img
                                            src={finalSrc}
                                            alt={dynamicAlt || ''}
                                            className="w-full rounded-[3rem] shadow-2xl border-4 border-white object-cover"
                                            {...props}
                                        />
                                        {dynamicAlt && (
                                            <span className="block text-center text-sm md:text-base text-gray-500 mt-6 font-bold italic tracking-wide">
                                                {dynamicAlt}
                                            </span>
                                        )}
                                    </span>
                                );
                            },
                            // Custom Blockquote styling
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-[10px] border-blue-600 bg-gray-50 p-12 md:p-20 my-20 rounded-[3rem] shadow-inner">
                                    <div className="text-3xl md:text-4xl font-black italic text-gray-900 leading-tight">
                                        {children}
                                    </div>
                                </blockquote>
                            )
                        }}
                    >
                        {displayContent}
                    </ReactMarkdown>
                </div>
            </div>

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
