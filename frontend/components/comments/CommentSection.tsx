import React, { useEffect, useState, useRef, useCallback } from 'react';
import { commentService, Comment } from '@/services/comment.service';
import { useSocket } from '@/hooks/useSocket';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import AuthModal from '@/components/AuthModal';
import ConfirmModal from '@/components/ConfirmModal';

interface CommentSectionProps {
    articleId: string;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
    const { user } = useAuth();
    const { joinRoom, subscribe } = useSocket();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

    const fetchComments = useCallback(async (pageNum: number) => {
        try {
            const data = await commentService.getComments(articleId, pageNum);
            if (pageNum === 1) {
                setComments(data.data);
            } else {
                setComments(prev => [...prev, ...data.data]);
            }

            if (data.meta) {
                const total = data.meta.total || 0;
                const limit = data.meta.limit || 10;
                setTotalPages(Math.ceil(total / limit));
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Failed to load comments', error);
        } finally {
            setLoading(false);
        }
    }, [articleId]);

    // Initial load
    useEffect(() => {
        fetchComments(1);
        joinRoom(articleId);
    }, [articleId, fetchComments, joinRoom]);

    // Helper to update state safely
    const addCommentToState = useCallback((newComment: Comment) => {
        setComments(prev => {
            // For top level:
            if (!newComment.parent_id) {
                if (prev.find(c => c.id === newComment.id)) return prev;
                return [newComment, ...prev];
            }

            // For replies:
            const updateReplies = (list: Comment[]): Comment[] => {
                return list.map(item => {
                    if (item.id === newComment.parent_id) {
                        // Check duplicate in replies
                        if (item.replies?.find(r => r.id === newComment.id)) return item;
                        return { ...item, replies: [newComment, ...(item.replies || [])] };
                    }
                    if (item.replies) {
                        return { ...item, replies: updateReplies(item.replies) };
                    }
                    return item;
                });
            };
            return updateReplies(prev);
        });
    }, []);

    // Listen for real-time events from socket
    useEffect(() => {
        const unsubscribeNew = subscribe('new_comment', (data: any) => {
            const newComment = data as Comment;
            if (newComment.article_id === articleId) {
                addCommentToState(newComment);
            }
        });

        const unsubscribeDelete = subscribe('comment_deleted', (data: any) => {
            const { id } = data;
            setComments(prev => {
                const updateDeleted = (list: Comment[]): Comment[] => {
                    return list.map(comment => {
                        if (comment.id === id) {
                            return { ...comment, is_deleted: true };
                        }
                        if (comment.replies) {
                            return { ...comment, replies: updateDeleted(comment.replies) };
                        }
                        return comment;
                    });
                };
                return updateDeleted(prev);
            });
        });

        const unsubscribeRestore = subscribe('comment_restored', (data: any) => {
            const { id } = data;
            setComments(prev => {
                const updateRestored = (list: Comment[]): Comment[] => {
                    return list.map(comment => {
                        if (comment.id === id) {
                            return { ...comment, is_deleted: false };
                        }
                        if (comment.replies) {
                            return { ...comment, replies: updateRestored(comment.replies) };
                        }
                        return comment;
                    });
                };
                return updateRestored(prev);
            });
        });

        return () => {
            unsubscribeNew();
            unsubscribeDelete();
            unsubscribeRestore();
        };
    }, [subscribe, articleId, addCommentToState]);

    const handleCreateComment = async (content: string) => {
        try {
            const newComment = await commentService.create({
                article_id: articleId,
                content
            });
            addCommentToState({ ...newComment, user: user as any });
            toast.success('Đã gửi bình luận!');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Không thể gửi bình luận';
            toast.error(message);
        }
    };

    const handleReply = async (parentId: string, content: string) => {
        try {
            const newReply = await commentService.create({
                article_id: articleId,
                content,
                parent_id: parentId
            });
            addCommentToState({ ...newReply, user: user as any });
            toast.success('Đã trả lời!');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Không thể trả lời';
            toast.error(message);
        }
    };

    const handleDelete = async (id: string) => {
        setCommentToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!commentToDelete) return;
        try {
            await commentService.delete(commentToDelete);
            // Refresh comments to show updated state
            fetchComments(1);
            toast.success('Đã thu hồi bình luận');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Không thể thu hồi bình luận';
            toast.error(message);
        } finally {
            setCommentToDelete(null);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await commentService.restore(id);
            // Refresh comments to show updated state
            fetchComments(1);
            toast.success('Đã phục hồi bình luận');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Không thể phục hồi bình luận';
            toast.error(message);
        }
    };

    return (
        <section className="border-t border-gray-100 pt-16 lg:pt-24 mt-16" id="comments">
            <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-black tracking-tight flex items-center gap-4">
                    Thảo luận
                    <span className="text-lg font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{comments.length}</span>
                </h3>
            </div>

            {user ? (
                <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CommentForm onSubmit={handleCreateComment} />
                </div>
            ) : (
                <div className="bg-gray-50 rounded-[2rem] p-12 text-center mb-16 border border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-2xl">
                        🔒
                    </div>
                    <h4 className="text-xl font-bold mb-3">Tham gia thảo luận</h4>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Hãy đăng nhập để chia sẻ góc nhìn của bạn và trao đổi với cộng đồng.</p>
                    <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="inline-block px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            )}

            <CommentList
                comments={comments}
                currentUser={user}
                onReply={handleReply}
                onDelete={handleDelete}
                onRestore={handleRestore}
            />

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            )}

            {page < totalPages && (
                <div className="text-center pt-8">
                    <button
                        onClick={() => fetchComments(page + 1)}
                        className="text-sm font-bold text-gray-500 hover:text-black uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-black pb-1"
                    >
                        Xem thêm bình luận
                    </button>
                </div>
            )}

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialTab="login"
            />

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Thu hồi bình luận"
                message="Bạn có chắc chắn muốn thu hồi bình luận này? Nội dung sẽ bị ẩn đi nhưng cấu trúc thảo luận vẫn được giữ nguyên."
                confirmText="Thu hồi"
                cancelText="Hủy bỏ"
                isDangerous={true}
            />
        </section>
    );
}
