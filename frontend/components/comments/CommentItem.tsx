import React, { useState } from 'react';
import { format } from 'date-fns';
import { Comment } from '@/services/comment.service';
import CommentForm from './CommentForm';
import { User } from '@/types/user';

interface CommentItemProps {
    comment: Comment;
    currentUser?: User | null;
    onReply: (parentId: string, content: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onRestore?: (id: string) => Promise<void>;
    depth?: number;
}

export default function CommentItem({ comment, currentUser, onReply, onDelete, onRestore, depth = 0 }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReplySubmit = async (content: string) => {
        setLoading(true);
        try {
            await onReply(comment.id, content);
            setIsReplying(false);
        } finally {
            setLoading(false);
        }
    };

    const isAuthor = currentUser?.id === comment.user_id;

    return (
        <div className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-gray-700 font-bold uppercase text-sm ring-2 ring-gray-50">
                        {comment.user?.username?.charAt(0) || comment.user?.full_name?.charAt(0) || 'U'}
                    </div>
                </div>

                <div className="flex-grow min-w-0">
                    <div className={`${comment.is_deleted ? 'bg-gray-100/50' : 'bg-gray-50/80 hover:bg-gray-50'} transition-colors rounded-2xl rounded-tl-none p-4 sm:p-5 border ${comment.is_deleted ? 'border-gray-200' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${comment.is_deleted ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {comment.is_deleted ? 'Người dùng' : (comment.user?.username || comment.user?.full_name || 'Anonymous')}
                                </span>
                                <span className="text-[10px] text-gray-300">•</span>
                                <time className="text-xs text-gray-500 font-medium">
                                    {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                                </time>
                            </div>
                            {!comment.is_deleted && isAuthor && onDelete && (
                                <button
                                    onClick={() => onDelete(comment.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Thu hồi bình luận"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                </button>
                            )}
                            {comment.is_deleted && isAuthor && onRestore && (
                                <button
                                    onClick={() => onRestore(comment.id)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Phục hồi bình luận"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                </button>
                            )}
                        </div>

                        <div className={`leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap break-words ${comment.is_deleted ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                            {comment.is_deleted ? '[Bình luận đã bị thu hồi]' : comment.content}
                        </div>
                    </div>

                    {!comment.is_deleted && depth < 10 && (
                        <div className="flex items-center gap-4 mt-2 ml-1">
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isReplying
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                Trả lời
                            </button>
                        </div>
                    )}

                    {isReplying && (
                        <div className="mt-3 ml-1 animate-in slide-in-from-top-2 duration-200">
                            <CommentForm
                                onSubmit={handleReplySubmit}
                                onCancel={() => setIsReplying(false)}
                                loading={loading}
                                autoFocus
                                placeholder={`Trả lời ${comment.user?.username || comment.user?.full_name || '...'}...`}
                            />
                        </div>
                    )}

                    {/* Nested Replies with Thread Line */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 md:pl-6 border-l-2 border-gray-100 space-y-4">
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    currentUser={currentUser}
                                    onReply={onReply}
                                    onDelete={onDelete}
                                    onRestore={onRestore}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
