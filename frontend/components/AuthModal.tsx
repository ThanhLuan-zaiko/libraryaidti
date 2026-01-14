"use client";

import React, { useState } from 'react';
import { IoClose, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirm_password: '',
        full_name: ''
    });

    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
        let score = 0;
        if (pass.length > 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 1) return { score: 25, label: 'Yếu', color: 'bg-red-500' };
        if (score === 2) return { score: 50, label: 'Trung bình', color: 'bg-yellow-500' };
        if (score === 3) return { score: 75, label: 'Mạnh', color: 'bg-green-500' };
        return { score: 100, label: 'Rất mạnh', color: 'bg-blue-500' };
    };

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (activeTab === 'login') {
                await login({
                    email: formData.email,
                    password: formData.password
                });
                toast.success('Đăng nhập thành công');
                onClose();
            } else {
                if (formData.password !== formData.confirm_password) {
                    toast.error('Mật khẩu xác nhận không khớp');
                    setLoading(false);
                    return;
                }
                await authService.register({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name
                });
                setActiveTab('login');
                toast.success('Đăng ký thành công! Hãy đăng nhập.');
            }
        } catch (err: any) {
            const message = err.response?.data?.error || 'Đã có lỗi xảy ra';
            toast.error(message);
            setError(message); // Keep inline for accessibilty/persistence if desired, or remove? I'll keep it for now but toast is main.
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div className="flex space-x-6">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`text-lg font-bold pb-2 transition-all ${activeTab === 'login' ? 'border-b-2 border-black text-black' : 'text-gray-400'
                                }`}
                        >
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`text-lg font-bold pb-2 transition-all ${activeTab === 'register' ? 'border-b-2 border-black text-black' : 'text-gray-400'
                                }`}
                        >
                            Đăng ký
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className={`p-3 rounded-lg text-sm ${error.includes('thành công') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {error}
                            </div>
                        )}

                        {activeTab === 'register' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Họ và tên</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    placeholder="Nhập họ và tên"
                                    required
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all outline-none"
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="example@gmail.com"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                >
                                    {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                                </button>
                            </div>
                            {activeTab === 'register' && formData.password && (
                                <div className="mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Độ mạnh mật khẩu</span>
                                        <span className={`text-[10px] font-bold ${getPasswordStrength(formData.password).color.replace('bg-', 'text-')}`}>
                                            {getPasswordStrength(formData.password).label}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getPasswordStrength(formData.password).color}`}
                                            style={{ width: `${getPasswordStrength(formData.password).score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {activeTab === 'register' && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        placeholder="••••••••"
                                        required
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                    >
                                        {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 transition-all transform active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                    Đang xử lý...
                                </span>
                            ) : (
                                activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        {activeTab === 'login' ? (
                            <>
                                Chưa có tài khoản?{' '}
                                <button onClick={() => setActiveTab('register')} className="text-black font-bold hover:underline">
                                    Đăng ký ngay
                                </button>
                            </>
                        ) : (
                            <>
                                Đã có tài khoản?{' '}
                                <button onClick={() => setActiveTab('login')} className="text-black font-bold hover:underline">
                                    Đăng nhập
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
