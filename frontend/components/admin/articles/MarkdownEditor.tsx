import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Columns, Eye, Edit3, Image as ImageIcon, Link as LinkIcon, Bold, Italic, List, ListOrdered, Quote, Code } from 'lucide-react';
import { getImageUrl } from '@/utils/image';

interface ImageReference {
    local_id?: string;
    image_url?: string;
    image_data?: string;
    description?: string;
    is_primary?: boolean;
}

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    images?: ImageReference[];
    placeholder?: string;
    minHeight?: string;
}

export interface MarkdownEditorRef {
    insertText: (text: string) => boolean;
    focus: () => void;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({
    value = '',
    onChange,
    images = [],
    placeholder = 'Viết nội dung bài viết...',
    minHeight = '500px'
}, ref) => {
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
        insertText: (text: string) => {
            if (!textareaRef.current) return false;

            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentText = textarea.value;

            const newText = currentText.substring(0, start) + text + currentText.substring(end);
            onChange(newText);

            // Set cursor position after insertion
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + text.length, start + text.length);
            }, 0);

            return true;
        },
        focus: () => {
            textareaRef.current?.focus();
        }
    }));

    const handleToolbarAction = (prefix: string, suffix: string = '', defaultValue: string = '') => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selection = textarea.value.substring(start, end) || defaultValue;

        const insertedText = prefix + selection + suffix;
        const newText = textarea.value.substring(0, start) + insertedText + textarea.value.substring(end);

        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
        }, 0);
    };

    return (
        <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Toolbar */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                        type="button"
                        onClick={() => handleToolbarAction('**', '**', 'Chữ đậm')}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                        title="Đậm (Ctrl+B)"
                    >
                        <Bold size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToolbarAction('*', '*', 'Chữ nghiêng')}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                        title="Nghiêng (Ctrl+I)"
                    >
                        <Italic size={18} />
                    </button>
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>
                    <button
                        type="button"
                        onClick={() => handleToolbarAction('\n- ', '', 'Danh sách')}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                        title="Danh sách dấu chấm"
                    >
                        <List size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToolbarAction('\n1. ', '', 'Danh sách')}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                        title="Danh sách số"
                    >
                        <ListOrdered size={18} />
                    </button>
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>
                    <button
                        type="button"
                        onClick={() => handleToolbarAction('> ', '', 'Trích dẫn')}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                        title="Trích dẫn"
                    >
                        <Quote size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToolbarAction('`', '`', 'code')}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                        title="Code"
                    >
                        <Code size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToolbarAction('[', '](url)', 'Liên kết')}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                        title="Liên kết"
                    >
                        <LinkIcon size={18} />
                    </button>
                </div>

                <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setViewMode('edit')}
                        className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Edit3 size={14} />
                        <span className="hidden sm:inline">Viết</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Columns size={14} />
                        <span className="hidden sm:inline">Song song</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Xem thử</span>
                    </button>
                </div>
            </div>

            {/* Editor & Preview Area */}
            <div className="flex flex-1 overflow-hidden" style={{ minHeight }}>
                {/* Editor */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                    <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r border-gray-100' : ''}`}>
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 w-full p-6 border-none focus:ring-0 resize-none text-base leading-relaxed text-gray-800 font-article outline-none bg-transparent"
                        />
                    </div>
                )}

                {/* Preview */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className="flex-1 p-6 overflow-y-auto prose prose-blue max-w-none prose-img:rounded-xl prose-pre:bg-gray-900 prose-pre:text-white">
                        {value ? (
                            <ReactMarkdown
                                key={`markdown-preview-${images.length}-${images.map(i => `${i.local_id}-${i.description}-${i.is_primary}`).join('|')}`}
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    img: ({ src, alt, ...props }) => {
                                        if (!src || src === '') return null;

                                        // Try to find the image in the current state by local_id or server URL
                                        // We check all possible ways an image can be referenced
                                        const findMatch = (img: any) =>
                                            (img.local_id && img.local_id === src) ||
                                            (img.image_url && (img.image_url === src || getImageUrl(img.image_url) === src));

                                        const refImage = images.find(findMatch);

                                        // "Smart Order": Labels match visual sorting (Primary first)
                                        const sortedImages = [...images].sort((a, b) =>
                                            (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1)
                                        );
                                        const visualIndex = sortedImages.findIndex(findMatch);

                                        const rawSrc = refImage
                                            ? (refImage.image_data || refImage.image_url || '')
                                            : src;

                                        const finalSrc = getImageUrl(typeof rawSrc === 'string' ? rawSrc : undefined);

                                        if (!finalSrc || finalSrc === '') return null;

                                        // Dynamic label: Prioritize visuals from gallery
                                        let dynamicAlt = alt;
                                        if (refImage && visualIndex !== -1) {
                                            const label = refImage.description
                                                ? `Ảnh ${visualIndex + 1}: ${refImage.description}`
                                                : `Ảnh ${visualIndex + 1}`;
                                            dynamicAlt = label;
                                        }

                                        return (
                                            <span className="block my-6">
                                                <img
                                                    src={finalSrc}
                                                    alt={dynamicAlt || ''}
                                                    className="rounded-xl shadow-lg border border-gray-100 mx-auto max-h-[600px] object-contain"
                                                    {...props}
                                                />
                                                {dynamicAlt && (
                                                    <span className="block text-center text-xs text-gray-500 mt-2 font-medium italic">
                                                        {dynamicAlt}
                                                    </span>
                                                )}
                                            </span>
                                        );
                                    }
                                }}
                            >
                                {value}
                            </ReactMarkdown>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic">
                                Xem thử bài viết của bạn tại đây...
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between items-center">
                <div className="text-[10px] text-gray-400 font-medium">
                    Hỗ trợ Markdown cơ bản và GFM
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                    {value.length} ký tự
                </div>
            </div>
        </div>
    );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
