import React, { useState } from 'react';
import { format } from 'date-fns';
import { Comment, commentService } from '@/services/comment.service';
import CommentForm from './CommentForm';
import { User } from '@/types/user';
import { toast } from 'react-hot-toast';
import { IoChevronDown, IoChatbubbleOutline, IoArrowUndoOutline, IoTrashOutline, IoRefreshOutline, IoPencilOutline } from 'react-icons/io5';

interface CommentItemProps {
    comment: Comment;
    currentUser?: User | null;
    onReply: (parentId: string, content: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onRestore?: (id: string) => Promise<void>;
    onEdit?: (id: string, content: string) => Promise<void>;
    depth?: number;
    articleId: string; // Needed for fetching paginated replies
}

export default function CommentItem({ comment, currentUser, onReply, onDelete, onRestore, onEdit, depth = 0, articleId }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [replyPage, setReplyPage] = useState(1);
    const [hasMoreReplies, setHasMoreReplies] = useState(false);
    const [displayedReplies, setDisplayedReplies] = useState<Comment[]>(comment.replies || []);
    const [isRepliesCollapsed, setIsRepliesCollapsed] = useState(true); // Collapse by default

    // Check if there might be more replies (basic heuristic)
    React.useEffect(() => {
        // If we have exactly 100 replies (the preload limit), there might be more
        setHasMoreReplies((comment.replies?.length || 0) >= 100);
        setDisplayedReplies(comment.replies || []);
    }, [comment.replies]);

    const handleReplySubmit = async (content: string) => {
        setLoading(true);
        try {
            await onReply(comment.id, content);
            setIsReplying(false);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (content: string) => {
        if (!onEdit) return;
        setLoading(true);
        try {
            await onEdit(comment.id, content);
            setIsEditing(false);
        } finally {
            setLoading(false);
        }
    };

    const loadMoreReplies = async () => {
        setLoadingMore(true);
        try {
            const nextPage = replyPage + 1;
            const response = await commentService.getReplies(articleId, comment.id, nextPage, 10);

            if (response.data.length > 0) {
                setDisplayedReplies(prev => [...prev, ...response.data]);
                setReplyPage(nextPage);
                setHasMoreReplies(response.data.length === 10); // Has more if we got a full page
            } else {
                setHasMoreReplies(false);
            }
        } catch (error: any) {
            toast.error('Không thể tải thêm phản hồi');
        } finally {
            setLoadingMore(false);
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
                    <div className={`${comment.is_deleted ? 'bg-gray-100/50' : isAuthor ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'bg-gray-50/80 hover:bg-gray-50'} transition-colors rounded-2xl rounded-tl-none p-4 sm:p-5 border ${comment.is_deleted ? 'border-gray-200' : isAuthor ? 'border-blue-100' : 'border-gray-100'} ${isAuthor && !comment.is_deleted ? 'border-l-4 border-l-blue-400' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${comment.is_deleted ? 'text-gray-400' : isAuthor ? 'text-blue-700' : 'text-gray-900'}`}>
                                    {comment.is_deleted ? 'Người dùng' : (comment.user?.username || comment.user?.full_name || 'Anonymous')}
                                </span>
                                {isAuthor && !comment.is_deleted && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
                                        Bạn
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-300">•</span>
                                <time className="text-xs text-gray-500 font-medium">
                                    {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                                </time>
                                {/* Show edited indicator if UpdatedAt > CreatedAt */}
                                {!comment.is_deleted && new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime() + 5000 && (
                                    <>
                                        <span className="text-[10px] text-gray-300">•</span>
                                        <span className="text-xs text-gray-400 italic">(đã chỉnh sửa)</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {!comment.is_deleted && isAuthor && onEdit && (
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Chỉnh sửa bình luận"
                                    >
                                        <IoPencilOutline className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {!comment.is_deleted && isAuthor && onDelete && (
                                    <button
                                        onClick={() => onDelete(comment.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Thu hồi bình luận"
                                    >
                                        <IoTrashOutline className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {comment.is_deleted && isAuthor && onRestore && (
                                    <button
                                        onClick={() => onRestore(comment.id)}
                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Phục hồi bình luận"
                                    >
                                        <IoRefreshOutline className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={`leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap break-words ${comment.is_deleted ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                            {comment.is_deleted ? '[Bình luận đã bị thu hồi]' : comment.content}
                        </div>
                    </div>

                    {/* Edit Mode */}
                    {isEditing && !comment.is_deleted && (
                        <div className="mt-3 ml-1 animate-in slide-in-from-top-2 duration-200">
                            <CommentForm
                                onSubmit={handleEditSubmit}
                                onCancel={() => setIsEditing(false)}
                                loading={loading}
                                autoFocus
                                initialValue={comment.content}
                                placeholder="Chỉnh sửa bình luận..."
                            />
                        </div>
                    )}

                    {!comment.is_deleted && depth < 10 && !isEditing && (
                        <div className="flex items-center gap-4 mt-2 ml-1">
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isReplying
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <IoArrowUndoOutline className="w-3.5 h-3.5" />
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

                    {/* Nested Replies - Collapsible */}
                    {displayedReplies && displayedReplies.length > 0 && (
                        <>
                            {/* Toggle Button */}
                            <button
                                onClick={() => setIsRepliesCollapsed(!isRepliesCollapsed)}
                                className="flex items-center gap-2 mt-3 ml-1 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <IoChatbubbleOutline className="w-4 h-4" />
                                <span>
                                    {isRepliesCollapsed
                                        ? `Xem ${displayedReplies.length} phản hồi`
                                        : 'Ẩn phản hồi'}
                                </span>
                                <IoChevronDown
                                    className={`w-4 h-4 transition-transform ${!isRepliesCollapsed ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Replies List */}
                            {!isRepliesCollapsed && (
                                <div className="mt-4 pl-4 md:pl-6 border-l-2 border-gray-100 space-y-4">
                                    {displayedReplies.map(reply => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            currentUser={currentUser}
                                            onReply={onReply}
                                            onDelete={onDelete}
                                            onRestore={onRestore}
                                            onEdit={onEdit}
                                            depth={depth + 1}
                                            articleId={articleId}
                                        />
                                    ))}

                                    {/* Load More Replies Button */}
                                    {hasMoreReplies && (
                                        <button
                                            onClick={loadMoreReplies}
                                            disabled={loadingMore}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                                                    <span>Đang tải...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IoChevronDown className="w-4 h-4" />
                                                    <span>Tải thêm phản hồi</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
