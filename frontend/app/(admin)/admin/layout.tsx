"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
    HiOutlineViewGrid,
    HiOutlineDocumentText,
    HiOutlineCollection,
    HiOutlineUsers,
    HiOutlineCog,
    HiOutlineArrowCircleLeft,
    HiMenuAlt2,
    HiX
} from "react-icons/hi";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Auto-close sidebar on mobile by default
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        handleResize(); // Set initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!loading) {
            if (!user || !user.roles || !user.roles.includes('ADMIN')) {
                router.push("/");
            }
        }
    }, [user, loading, router]);

    if (loading || !user || !user.roles.includes('ADMIN')) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: HiOutlineViewGrid },
        { name: "Bài viết", href: "/admin/articles", icon: HiOutlineDocumentText },
        { name: "Danh mục", href: "/admin/categories", icon: HiOutlineCollection },
        { name: "Người dùng", href: "/admin/users", icon: HiOutlineUsers },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex bg-gray-50/50 overflow-hidden font-sans">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out md:relative shrink-0
        ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-20 translate-x-0 md:w-20'}
        ${!isSidebarOpen ? 'max-md:-translate-x-full' : ''}
      `}>
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Logo Section */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
                        <Link href="/" className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                                <span className="text-white font-black text-sm">C</span>
                            </div>
                            <div className={`flex items-center space-x-2 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 h-0 overflow-hidden'}`}>
                                <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">
                                    DS<span className="text-blue-600">AIDTI</span>
                                </span>
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded leading-none">ADMIN</span>
                            </div>
                        </Link>
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 lg:hidden"
                            >
                                <HiX className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
                        <p className={`px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest transition-all duration-300 ${isSidebarOpen ? 'opacity-100 mb-2' : 'opacity-0 h-0 overflow-hidden mb-0'}`}>
                            Chính
                        </p>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center px-3 py-3 rounded-2xl transition-all duration-200 group relative
                    ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                                    title={!isSidebarOpen ? item.name : ""}
                                >
                                    <item.icon className={`w-6 h-6 shrink-0 transition-transform duration-200 ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span className={`ml-3 font-bold text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                        {item.name}
                                    </span>
                                    {isActive && !isSidebarOpen && (
                                        <div className="absolute right-0 w-1 h-6 bg-blue-600 rounded-l-full" />
                                    )}
                                </Link>
                            );
                        })}

                        <div className={`pt-6 pb-2 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                            Hệ thống
                        </div>
                        <Link
                            href="/admin/settings"
                            className={`
                flex items-center px-3 py-3 rounded-2xl transition-all duration-200 group relative
                ${pathname === "/admin/settings"
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
                            title={!isSidebarOpen ? "Cài đặt" : ""}
                        >
                            <HiOutlineCog className={`w-6 h-6 shrink-0 ${pathname === "/admin/settings" ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`ml-3 font-bold text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                Cài đặt
                            </span>
                        </Link>
                    </nav>

                    {/* Bottom Action */}
                    <div className="p-4 border-t border-gray-100 shrink-0">
                        <Link
                            href="/"
                            className={`
                flex items-center px-3 py-3 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm group
              `}
                            title={!isSidebarOpen ? "Thoát Dashboard" : ""}
                        >
                            <HiOutlineArrowCircleLeft className="w-6 h-6 shrink-0" />
                            <span className={`ml-3 whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                Thoát Dashboard
                            </span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all active:scale-95 border border-transparent hover:border-gray-200"
                        >
                            <HiMenuAlt2 className={`w-6 h-6 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
                        </button>
                        <h2 className="text-lg font-black text-gray-800 hidden sm:block tracking-tight">
                            {navItems.find(i => i.href === pathname)?.name || "Dashboard"}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-3 group cursor-pointer p-1.5 pl-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                        <div className="flex flex-col items-end mr-1 hidden sm:flex">
                            <span className="text-xs font-black text-gray-900 leading-none mb-1">{user?.full_name}</span>
                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Quản trị viên</span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-200 ring-2 ring-white">
                            {user?.full_name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                {/* Dynamic Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-gray-50/50">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
