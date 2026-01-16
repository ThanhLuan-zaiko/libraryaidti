import React from 'react';
import { Comment } from '@/services/comment.service';
import CommentItem from './CommentItem';
import { User } from '@/types/user';

interface CommentListProps {
    comments: Comment[];
    currentUser?: User | null;
    onReply: (parentId: string, content: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onRestore?: (id: string) => Promise<void>;
    onEdit?: (id: string, content: string) => Promise<void>;
    articleId: string;
}

export default function CommentList({ comments, currentUser, onReply, onDelete, onRestore, onEdit, articleId }: CommentListProps) {
    if (!comments || comments.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {comments.map(comment => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onReply={onReply}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onEdit={onEdit}
                    depth={0}
                    articleId={articleId}
                />
            ))}
        </div>
    );
}
