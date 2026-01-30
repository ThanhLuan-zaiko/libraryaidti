'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HiSearch, HiChevronDown } from 'react-icons/hi';
import { NavLink } from './types';
import UserMenu from './UserMenu';

interface MobileMenuProps {
    isOpen: boolean;
    navLinks: NavLink[];
    onClose: () => void;
    onOpenAuth: (tab: 'login' | 'register') => void;
    onOpenProfile: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
    isOpen,
    navLinks,
    onClose,
    onOpenAuth,
    onOpenProfile
}) => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    return (
        <>
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
                                            onClick={() => !link.dropdown && onClose()}
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
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeDropdown === link.name ? 'max-h-[1000px]' : 'max-h-0'}`}>
                                        <div className="bg-gray-50/50 mx-2 rounded-2xl border border-gray-100/50 mb-4 px-2 py-2">
                                            {link.dropdown?.map((item: NavLink) => (
                                                <div key={item.name}>
                                                    <div className="flex items-center justify-between">
                                                        <Link
                                                            href={item.href}
                                                            className="flex-grow px-4 py-3 text-base font-medium text-gray-600 hover:text-blue-600 active:bg-blue-50 rounded-xl transition-all"
                                                            onClick={() => onClose()}
                                                        >
                                                            {item.name}
                                                        </Link>
                                                        {item.dropdown && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setActiveDropdown(activeDropdown === `${link.name}-${item.name}` ? link.name : `${link.name}-${item.name}`);
                                                                }}
                                                                className="p-3"
                                                            >
                                                                <HiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${activeDropdown === `${link.name}-${item.name}` ? 'rotate-180 text-black' : ''}`} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {item.dropdown && (
                                                        <div className={`overflow-hidden transition-all duration-300 ${activeDropdown === `${link.name}-${item.name}` ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                            <div className="pl-4 border-l-2 border-gray-100 ml-4 mb-2">
                                                                {item.dropdown.map((subItem: NavLink) => (
                                                                    <Link
                                                                        key={subItem.name}
                                                                        href={subItem.href}
                                                                        className="block px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-all"
                                                                        onClick={() => onClose()}
                                                                    >
                                                                        {subItem.name}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Unified Mobile Action */}
                    <div className={`pt-4 transform transition-all duration-500 delay-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <UserMenu
                            isMobile={true}
                            onOpenAuth={onOpenAuth}
                            onOpenProfile={onOpenProfile}
                            onCloseMobileMenu={onClose}
                        />
                    </div>
                </div>
            </div>

            {/* Dark Overlay for Focus */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/5 backdrop-blur-[1px] -z-10 transition-opacity duration-500"
                    onClick={onClose}
                />
            )}
        </>
    );
};

export default MobileMenu;
