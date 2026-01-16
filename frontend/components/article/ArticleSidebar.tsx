'use client';

import React, { useEffect, useState } from 'react';
import { getImageUrl } from '@/utils/image';
import { HiOutlineShare, HiOutlineArrowNarrowRight, HiCheck } from 'react-icons/hi';
import { Article } from '@/services/article.service';

export interface TOCItem {
    id: string;
    label: string;
    level: number;
}

interface ArticleSidebarProps {
    article: Article;
    toc: TOCItem[];
    readingProgress: number;
    showCopied?: boolean;
    onShare?: () => void;
}


const ArticleSidebar: React.FC<ArticleSidebarProps> = ({ article, toc, readingProgress, showCopied, onShare }) => {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const handleScroll = () => {
            const headings = toc.map(item => document.getElementById(item.id)).filter(Boolean);
            let currentId = '';

            for (const heading of headings) {
                if (heading) {
                    const rect = heading.getBoundingClientRect();
                    // If heading is in the top 150px of viewport, mark it active
                    if (rect.top <= 150) {
                        currentId = heading.id;
                    }
                }
            }
            setActiveId(currentId);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [toc]);

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 120; // High header offset
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <aside className="lg:col-span-4 relative h-full">
            <div className="sticky top-40 space-y-20">
                {/* Immersive TOC Widget */}
                <div className="bg-white p-6 lg:p-12 rounded-[2rem] lg:rounded-[3.5rem] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-12">
                        <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                            </span>
                            Sectioning
                        </h4>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">PROGRESS {Math.round(readingProgress)}%</span>
                    </div>
                    <nav className="max-h-[400px] overflow-y-auto no-scrollbar pr-4">
                        {toc.length > 0 ? (
                            <ul className="space-y-8">
                                {toc.map((item, index) => {
                                    const isActive = activeId === item.id;
                                    const num = (index + 1).toString().padStart(2, '0');

                                    const imageMatch = item.label.match(/!\[([^\]]*)\]\(([^)]+)\)/);

                                    return (
                                        <li key={item.id} className="group cursor-pointer" onClick={() => scrollTo(item.id)}>
                                            <div className={`flex items-center gap-6 transition-all duration-500 ${isActive ? 'translate-x-4' : 'hover:translate-x-2'}`}>
                                                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] font-black transition-all ${isActive ? 'bg-blue-600 text-white shadow-3xl shadow-blue-200 rotate-12' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-xl'}`}>
                                                    {num}
                                                </span>
                                                <span className={`text-base tracking-tight transition-colors ${isActive ? 'text-gray-950 font-black' : 'text-gray-400 font-bold group-hover:text-gray-950'} ${item.level > 2 ? 'pl-4' : ''}`}>
                                                    {imageMatch ? (
                                                        <img
                                                            src={getImageUrl(imageMatch[2])}
                                                            alt={imageMatch[1]}
                                                            className="w-full h-auto rounded-xl shadow-sm border border-gray-100 my-2 block"
                                                        />
                                                    ) : (
                                                        item.label
                                                    )}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-sm italic">Không có tiêu đề nào để hiển thị</p>
                        )}
                    </nav>
                </div>

                {/* Premium Article DNA Decoration */}
                <div className="relative group bg-gray-950 rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-12 overflow-hidden shadow-4xl hover:shadow-blue-900/40 transition-all duration-700">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-50" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />

                    <div className="relative z-10 space-y-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-8 bg-blue-500" />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Article DNA</span>
                            </div>
                            <h4 className="text-3xl font-black text-white leading-tight tracking-tighter">Cấu trúc <br /> của tri thức.</h4>
                        </div>

                        <div className="space-y-10">
                            {[
                                { label: 'Chiều sâu nội dung', val: `${article.depth || 0}%`, color: 'from-blue-600 to-indigo-600' },
                                { label: 'Độ minh bạch thông tin', val: `${article.complexity || 0}%`, color: 'from-indigo-500 to-purple-500' },
                                { label: 'Chỉ số tác động', val: `${article.impact || 0}%`, color: 'from-blue-400 to-blue-600' }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                                        <span className="text-lg font-black text-white tabular-nums">{stat.val}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 delay-300 shadow-[0_0_15px_rgba(37,99,235,0.4)]`}
                                            style={{ width: stat.val }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6">
                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-md group-hover:bg-white/10 transition-colors">
                                <p className="text-gray-400 text-xs font-medium leading-relaxed italic">
                                    &quot;Biến dữ liệu thô thành cái nhìn chiến lược. Mỗi phân đoạn đều được tối ưu cho khả năng tiếp nhận tối đa.&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Discovery Component */}
                <div
                    onClick={async () => {
                        if (onShare) {
                            onShare();
                            return;
                        }

                        const shareData = {
                            title: article.title,
                            text: article.summary,
                            url: window.location.href,
                        };

                        try {
                            if (navigator.share) {
                                await navigator.share(shareData);
                            } else {
                                await navigator.clipboard.writeText(window.location.href);
                            }
                        } catch (err) {
                            console.error('Error sharing:', err);
                        }
                    }}
                    className="group relative p-6 lg:p-12 rounded-[2rem] lg:rounded-[3.5rem] bg-blue-50 border border-transparent flex flex-col items-center text-center space-y-8 shadow-xl hover:bg-white hover:border-blue-100 transition-all duration-500 cursor-pointer overflow-hidden"
                >

                    <div className="absolute inset-0 bg-blue-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                    <div className="relative z-10 overflow-hidden">
                        <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center text-blue-600 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <HiOutlineShare className="w-10 h-10" />
                        </div>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h5 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Kiến thức <br /> không giới hạn.</h5>
                        <p className="text-sm text-gray-500 font-bold leading-relaxed px-4">Hãy để tri thức lan tỏa mạnh mẽ hơn trong cộng đồng của bạn.</p>
                    </div>
                    <button className="relative z-10 flex items-center gap-3 text-blue-600 font-black text-sm uppercase tracking-widest hover:gap-5 transition-all">
                        SHARE INSIGHT <HiOutlineArrowNarrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default ArticleSidebar;
