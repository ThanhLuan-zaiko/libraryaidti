"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiChevronDown, HiSearch, HiMenu, HiX } from 'react-icons/hi';
import { IoLogOutOutline, IoPersonOutline } from 'react-icons/io5';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

const Navbar = () => {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Hide navbar on admin routes - Moved after all hooks to comply with Rules of Hooks
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        window.location.reload();
    };

    const openAuth = (tab: 'login' | 'register') => {
        setAuthTab(tab);
        setIsAuthModalOpen(true);
        setIsOpen(false); // close mobile menu
    };

    const navLinks = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Chính trị', href: '/politics' },
        { name: 'Kinh doanh', href: '/business' },
        {
            name: 'Công nghệ',
            href: '/technology',
            dropdown: [
                { name: 'AI & Robot', href: '/technology/ai' },
                { name: 'Thiết bị', href: '/technology/gadgets' },
                { name: 'Phần mềm', href: '/technology/software' },
                { name: 'An ninh mạng', href: '/technology/cybersecurity' },
            ]
        },
        { name: 'Thể thao', href: '/sports' },
        { name: 'Giải trí', href: '/entertainment' },
        {
            name: 'Thêm',
            href: '#',
            dropdown: [
                { name: 'Sức khỏe', href: '/health' },
                { name: 'Khoa học', href: '/science' },
                { name: 'Đời sống', href: '/lifestyle' },
                { name: 'Du lịch', href: '/travel' },
            ]
        },
    ];

    // Unified User Action component
    const UserActions = ({ isMobile = false }) => {
        if (user) {
            if (isMobile) {
                return (
                    <div className="flex flex-col space-y-3 w-full">
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shadow-sm">
                                {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{user.full_name}</span>
                                <span className="text-xs text-gray-500">{user.email}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => { setIsProfileModalOpen(true); setIsOpen(false); }}
                            className="flex items-center space-x-3 p-4 hover:bg-gray-50 rounded-xl transition-all border border-gray-100"
                        >
                            <IoPersonOutline size={20} />
                            <span className="font-semibold">Thông tin tài khoản</span>
                        </button>
                        {user.roles && user.roles.includes('ADMIN') && (
                            <Link
                                href="/admin"
                                onClick={() => setIsOpen(false)}
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
                                    onClick={() => { setIsProfileModalOpen(true); setIsProfileDropdownOpen(false); }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-all font-semibold"
                                >
                                    <IoPersonOutline size={18} />
                                    <span>Thông tin & Mật khẩu</span>
                                </button>
                                {user.roles && user.roles.includes('ADMIN') && (
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
                    onClick={() => openAuth('login')}
                    className={`bg-black hover:bg-zinc-800 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md ${isMobile ? 'w-full py-4 text-lg' : 'px-6 py-2.5 text-sm'}`}
                >
                    Đăng nhập
                </button>
            </div>
        );
    };

    return (
        <>
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 py-1'
                    : 'bg-white border-b border-gray-200 py-2'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Logo Section */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="group flex items-center">
                                <span className="text-2xl font-black tracking-tighter text-black uppercase transition-transform duration-300 group-hover:scale-105">
                                    CDS<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-300">AIDTI</span>
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-1">
                            {navLinks.map((link) => (
                                <div
                                    key={link.name}
                                    className="relative group flex items-center h-20"
                                    onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                                    onMouseLeave={() => link.dropdown && setActiveDropdown(null)}
                                >
                                    <Link
                                        href={link.href}
                                        className="px-2 xl:px-4 py-2 text-sm font-semibold text-gray-700 hover:text-black rounded-full hover:bg-gray-50 transition-all duration-300 flex items-center"
                                    >
                                        {link.name}
                                        {link.dropdown && (
                                            <HiChevronDown className="ml-1 w-4 h-4 text-gray-400 group-hover:text-black transition-transform duration-500 group-hover:rotate-180" />
                                        )}
                                    </Link>

                                    {/* Dropdown Menu */}
                                    {link.dropdown && (
                                        <div className={`absolute left-0 top-[90%] pt-2 w-52 z-50 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0`}>
                                            <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 overflow-hidden">
                                                {link.dropdown.map((item, idx) => (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        style={{ transitionDelay: `${idx * 40}ms` }}
                                                        className="block px-5 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 transform translate-x-0 group-hover:translate-x-1"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Integrated Search Bar & Unified Actions (Desktop) */}
                        <div className="hidden lg:flex items-center space-x-6">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tin tức..."
                                    className="bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm w-36 xl:w-64 focus:ring-2 focus:ring-blue-500 focus:bg-white lg:focus:w-48 xl:focus:w-72 transition-all duration-300 outline-none"
                                />
                                <HiSearch className="absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-blue-600 transition-colors w-4 h-4" />
                            </div>
                            <UserActions />
                        </div>

                        {/* Mobile Button Wrapper */}
                        <div className="lg:hidden flex items-center space-x-3">
                            <button className="text-gray-500 hover:text-black p-2 transition-colors">
                                <HiSearch className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-black hover:bg-gray-100 focus:outline-none transition-all duration-300 group overflow-hidden"
                            >
                                <span className="sr-only">Mở menu chính</span>
                                <div className="flex flex-col space-y-1.5 items-end group-active:scale-90 transition-transform duration-200">
                                    <span className={`block h-0.5 bg-black transition-all duration-300 ease-out rounded-full ${isOpen ? 'w-6 translate-y-2 rotate-45' : 'w-6'}`}></span>
                                    <span className={`block h-0.5 bg-black transition-all duration-300 ease-out rounded-full ${isOpen ? 'w-0 opacity-0' : 'w-4'}`}></span>
                                    <span className={`block h-0.5 bg-black transition-all duration-300 ease-out rounded-full ${isOpen ? 'w-6 -translate-y-2 -rotate-45' : 'w-5'}`}></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div
                    className={`lg:hidden fixed inset-x-0 top-[64px] md:top-[72px] bg-white border-t border-gray-100 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
                        }`}
                >
                    <div className="max-h-[85vh] overflow-y-auto px-4 py-6 space-y-4">
                        {/* Mobile Search Bar */}
                        <div className="relative mb-2">
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="w-full bg-gray-50 border-none rounded-xl py-4 pl-12 pr-4 text-base focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                            <HiSearch className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
                        </div>

                        {/* Mobile Links */}
                        <div className="space-y-1">
                            {navLinks.map((link, idx) => (
                                <div
                                    key={link.name}
                                    style={{ transitionDelay: `${idx * 40}ms` }}
                                    className={`transform transition-all duration-500 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <Link
                                                href={link.href}
                                                className="flex-grow px-4 py-3.5 text-lg font-bold text-gray-900 active:text-blue-600 transition-colors"
                                                onClick={() => !link.dropdown && setIsOpen(false)}
                                            >
                                                {link.name}
                                            </Link>
                                            {link.dropdown && (
                                                <button
                                                    onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                                                    className="p-4"
                                                >
                                                    <HiChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180 text-black' : ''}`} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Mobile Dropdown Sub-menu */}
                                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeDropdown === link.name ? 'max-h-96' : 'max-h-0'}`}>
                                            <div className="bg-gray-50/50 mx-2 rounded-2xl border border-gray-100/50 mb-4 px-2 py-2">
                                                {link.dropdown?.map((item) => (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-blue-600 active:bg-blue-50 rounded-xl transition-all"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Unified Mobile Action */}
                        <div className={`pt-4 transform transition-all duration-500 delay-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                            <UserActions isMobile={true} />
                        </div>
                    </div>
                </div>

                {/* Dark Overlay for Focus */}
                {isOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/5 backdrop-blur-[1px] -z-10 transition-opacity duration-500"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </nav>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialTab={authTab}
            />
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                user={user}
            />
        </>
    );
};

export default Navbar;
