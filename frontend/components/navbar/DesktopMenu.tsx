'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HiChevronDown } from 'react-icons/hi';
import { NavLink } from './types';

interface DesktopMenuProps {
    navLinks: NavLink[];
}

const DesktopMenu: React.FC<DesktopMenuProps> = ({ navLinks }) => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    return (
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
                                {link.dropdown.map((item: NavLink, idx: number) => (
                                    <div key={item.name} className="relative group/sub">
                                        <Link
                                            href={item.href}
                                            style={{ transitionDelay: `${idx * 40}ms` }}
                                            className="flex items-center justify-between px-5 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                        >
                                            <span>{item.name}</span>
                                            {item.dropdown && (
                                                <HiChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg] group-hover/sub:text-blue-600" />
                                            )}
                                        </Link>

                                        {item.dropdown && (
                                            <div className="absolute left-full top-0 ml-1 w-52 opacity-0 translate-x-2 pointer-events-none group-hover/sub:opacity-100 group-hover/sub:translate-x-0 group-hover/sub:pointer-events-auto transition-all duration-300">
                                                <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 overflow-hidden">
                                                    {item.dropdown.map((subItem: NavLink) => (
                                                        <Link
                                                            key={subItem.name}
                                                            href={subItem.href}
                                                            className="block px-5 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
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
                    )}
                </div>
            ))}
        </div>
    );
};

export default DesktopMenu;
