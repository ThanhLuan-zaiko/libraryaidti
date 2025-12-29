"use client";

import { useEffect, useState } from "react";
import { FiLock, FiLogOut } from "react-icons/fi";

interface AccountLockedModalProps {
    isOpen: boolean;
    onLogout: () => void;
}

export default function AccountLockedModal({ isOpen, onLogout }: AccountLockedModalProps) {
    const [countdown, setCountdown] = useState(15);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, onLogout]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center">
                    <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <FiLock className="w-10 h-10 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Tài khoản đã bị khóa
                    </h2>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Tài khoản của bạn đã bị vô hiệu hóa bởi quản trị viên.
                        Vui lòng liên hệ với bộ phận hỗ trợ để biết thêm chi tiết.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-8">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                            Hệ thống sẽ tự động đăng xuất sau
                        </p>
                        <span className="text-3xl font-bold text-red-600">
                            {countdown}s
                        </span>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                    >
                        <FiLogOut className="w-5 h-5" />
                        Đăng xuất ngay
                    </button>
                </div>
            </div>
        </div>
    );
}
