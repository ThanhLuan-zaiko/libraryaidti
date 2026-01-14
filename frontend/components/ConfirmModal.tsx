import React from 'react';
import { IoWarning, IoInformationCircle } from 'react-icons/io5';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    isDangerous = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDangerous ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                    {isDangerous ? (
                        <IoWarning className="w-6 h-6 text-red-600" />
                    ) : (
                        <IoInformationCircle className="w-6 h-6 text-blue-600" />
                    )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-all ${isDangerous
                            ? 'bg-red-600 hover:bg-red-700 shadow-sm hover:shadow'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
