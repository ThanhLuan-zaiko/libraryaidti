'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IoLogOutOutline, IoPersonOutline } from 'react-icons/io5';
import { HiChevronDown } from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';

interface UserMenuProps {
    isMobile?: boolean;
    onOpenAuth: (tab: 'login' | 'register') => void;
    onOpenProfile: () => void;
    onCloseMobileMenu?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
    isMobile = false,
    onOpenAuth,
    onOpenProfile,
    onCloseMobileMenu
}) => {
    const { user, logout } = useAuth();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        window.location.reload();
    };

    const handleCloseMobile = () => {
        if (onCloseMobileMenu) onCloseMobileMenu();
    }

    if (user) {
        if (isMobile) {
            return (
                <div className="flex flex-col space-y-3 w-full">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                            {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-gray-900 truncate">{user.full_name}</span>
                            <span className="text-xs text-gray-500 truncate">{user.email}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { onOpenProfile(); handleCloseMobile(); }}
                        className="flex items-center space-x-3 p-4 hover:bg-gray-50 rounded-xl transition-all border border-gray-100"
                    >
                        <IoPersonOutline size={20} />
                        <span className="font-semibold">Thông tin tài khoản</span>
                    </button>
                    {user.roles && user.roles.some((r: any) => r.name === 'ADMIN') && (
                        <Link
                            href="/admin"
                            onClick={handleCloseMobile}
                            className="flex items-center space-x-3 p-4 hover:bg-blue-50 text-blue-600 rounded-xl transition-all border border-blue-100"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                            <span className="font-bold">Trang Quản Trị</span>
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 p-4 hover:bg-red-50 text-red-600 rounded-xl transition-all border border-red-100"
                    >
                        <IoLogOutOutline size={20} />
                        <span className="font-semibold">Đăng xuất</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="relative">
                <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-3 group text-sm font-medium text-gray-700 bg-gray-50/50 hover:bg-gray-100/80 transition-all px-3 py-1.5 rounded-full border border-gray-100"
                >
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden xl:inline font-semibold whitespace-nowrap truncate max-w-[120px]">{user.full_name}</span>
                    <HiChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-gray-50">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tài khoản</p>
                                <p className="text-sm font-bold text-black truncate">{user.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={() => { onOpenProfile(); setIsProfileDropdownOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-all font-semibold"
                            >
                                <IoPersonOutline size={18} />
                                <span>Thông tin & Mật khẩu</span>
                            </button>
                            {user.roles && user.roles.some((r: any) => r.name === 'ADMIN') && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsProfileDropdownOpen(false)}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-all font-bold border-t border-gray-50"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    </div>
                                    <span>Trang Quản Trị</span>
                                </Link>
                            )}
                            <div className="h-px bg-gray-50 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all"
                            >
                                <IoLogOutOutline size={18} />
                                <span className="font-bold">Đăng xuất</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center ${isMobile ? 'w-full' : ''}`}>
            <button
                onClick={() => {
                    onOpenAuth('login');
                    handleCloseMobile();
                }}
                className={`bg-black hover:bg-zinc-800 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md ${isMobile ? 'w-full py-4 text-lg' : 'px-6 py-2.5 text-sm'}`}
            >
                Đăng nhập
            </button>
        </div>
    );
};

export default UserMenu;
