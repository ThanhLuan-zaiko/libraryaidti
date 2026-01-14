import React, { useState } from 'react';

interface CommentFormProps {
    onSubmit: (content: string) => Promise<void>;
    onCancel?: () => void;
    placeholder?: string;
    loading?: boolean;
    autoFocus?: boolean;
}

export default function CommentForm({
    onSubmit,
    onCancel,
    placeholder = 'What are your thoughts?',
    loading = false,
    autoFocus = false
}: CommentFormProps) {
    const [content, setContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        await onSubmit(content);
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
                <textarea
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-y text-sm md:text-[15px] placeholder:text-gray-400"
                    placeholder={placeholder === 'What are your thoughts?' ? 'Chia sẻ góc nhìn của bạn...' : placeholder}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                    autoFocus={autoFocus}
                />
            </div>
            <div className="flex justify-end gap-3 mt-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!content.trim() || loading}
                    className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Đăng...</span>
                        </>
                    ) : (
                        'Gửi bình luận'
                    )}
                </button>
            </div>
        </form>
    );
}
