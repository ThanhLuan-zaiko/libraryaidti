"use client";

import { useEffect, useState } from "react";
import { FiShield, FiLogOut, FiAlertCircle } from "react-icons/fi";

interface PermissionUpdateModalProps {
    isOpen: boolean;
    onRedirect: () => void;
    type: 'promoted' | 'demoted';
}

export default function PermissionUpdateModal({ isOpen, onRedirect, type }: PermissionUpdateModalProps) {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (!isOpen || type === 'promoted') return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onRedirect();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, onRedirect, type]);

    if (!isOpen) return null;

    const isDemoted = type === 'demoted';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDemoted ? 'bg-orange-50' : 'bg-green-50'
                        }`}>
                        {isDemoted ? (
                            <FiAlertCircle className="w-10 h-10 text-orange-500" />
                        ) : (
                            <FiShield className="w-10 h-10 text-green-500" />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isDemoted ? 'Quyền truy cập thay đổi' : 'Chúc mừng!'}
                    </h2>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {isDemoted
                            ? 'Quyền hạn của bạn đã được cập nhật. Bạn không còn quyền truy cập vào trang này.'
                            : 'Quyền hạn của bạn đã được nâng cấp. Bạn hiện có quyền truy cập vào các tính năng quản trị.'}
                    </p>

                    {isDemoted ? (
                        <div className="bg-gray-50 rounded-xl p-4 mb-8">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                Trở về trang chủ sau
                            </p>
                            <span className="text-3xl font-bold text-orange-600">
                                {countdown}s
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={onRedirect}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                        >
                            <FiShield className="w-5 h-5" />
                            Tiếp tục
                        </button>
                    )}

                    {isDemoted && (
                        <button
                            onClick={onRedirect}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                        >
                            <FiLogOut className="w-5 h-5" />
                            Về trang chủ ngay
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
