"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiSearch } from 'react-icons/hi';
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { categoryService, Category } from '@/services/category.service';
import { articleService, Article } from '@/services/article.service';
import { NavLink } from './navbar/types';
import UserMenu from './navbar/UserMenu';
import DesktopMenu from './navbar/DesktopMenu';
import MobileMenu from './navbar/MobileMenu';
import SearchDropdown from './search/SearchDropdown';

const Navbar = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<Article[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Fetch categories for dynamic menu
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.getTree();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Perform search when debounced query changes
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchQuery || debouncedSearchQuery.trim().length < 2) {
                setSearchResults([]);
                setTotalResults(0);
                setIsSearchOpen(false);
                return;
            }

            setIsSearchLoading(true);
            setIsSearchOpen(true);

            try {
                const response = await articleService.search({
                    q: debouncedSearchQuery.trim(),
                    limit: 5,
                    status: 'PUBLISHED'
                });

                setSearchResults(response.data);
                setTotalResults(response.meta.total);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search failed:', error);
                setSearchResults([]);
                setTotalResults(0);
            } finally {
                setIsSearchLoading(false);
            }
        };

        performSearch();
    }, [debouncedSearchQuery]);

    // Handle keyboard navigation
    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isSearchOpen || searchResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                    const article = searchResults[selectedIndex];
                    window.location.href = `/article/${article.slug}`;
                } else if (searchQuery.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsSearchOpen(false);
                searchInputRef.current?.blur();
                break;
        }
    }, [isSearchOpen, searchResults, selectedIndex, searchQuery]);

    // Close search dropdown
    const handleCloseSearch = useCallback(() => {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
    }, []);

    // Hide navbar on admin routes
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    const openAuth = (tab: 'login' | 'register') => {
        setAuthTab(tab);
        setIsAuthModalOpen(true);
        setIsOpen(false); // close mobile menu
    };

    // Transform categories to nav items
    const categoryToNavItem = (cat: Category): NavLink => ({
        name: cat.name,
        href: `/category/${cat.slug}`,
        dropdown: cat.children && cat.children.length > 0
            ? cat.children.map(child => categoryToNavItem(child))
            : undefined
    });

    const dynamicLinks = categories.map(categoryToNavItem);

    const MAX_LINKS = 4;
    const initialLinks: NavLink[] = [
        { name: 'Trang chủ', href: '/' },
    ];

    let navLinks: NavLink[] = [...initialLinks];

    if (dynamicLinks.length <= MAX_LINKS) {
        navLinks = [...navLinks, ...dynamicLinks];
    } else {
        navLinks = [...navLinks, ...dynamicLinks.slice(0, MAX_LINKS)];
        navLinks.push({
            name: 'Thêm',
            href: '#',
            dropdown: dynamicLinks.slice(MAX_LINKS)
        });
    }

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
                        <DesktopMenu navLinks={navLinks} />

                        {/* Integrated Search Bar & Unified Actions (Desktop) */}
                        <div className="hidden lg:flex items-center space-x-6">
                            <div className="relative group">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    onFocus={() => {
                                        if (searchQuery.trim().length >= 2) {
                                            setIsSearchOpen(true);
                                        }
                                    }}
                                    placeholder="Tìm kiếm tin tức..."
                                    className="bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm w-36 xl:w-64 focus:ring-2 focus:ring-blue-500 focus:bg-white lg:focus:w-48 xl:focus:w-72 transition-all duration-300 outline-none"
                                />
                                <HiSearch className="absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-blue-600 transition-colors w-4 h-4" />

                                {/* Search Dropdown */}
                                <SearchDropdown
                                    query={searchQuery}
                                    isOpen={isSearchOpen}
                                    onClose={handleCloseSearch}
                                    results={searchResults}
                                    isLoading={isSearchLoading}
                                    totalResults={totalResults}
                                    selectedIndex={selectedIndex}
                                    onResultClick={handleCloseSearch}
                                />
                            </div>
                            <UserMenu
                                onOpenAuth={openAuth}
                                onOpenProfile={() => setIsProfileModalOpen(true)}
                            />
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
                <MobileMenu
                    isOpen={isOpen}
                    navLinks={navLinks}
                    onClose={() => setIsOpen(false)}
                    onOpenAuth={openAuth}
                    onOpenProfile={() => setIsProfileModalOpen(true)}
                />
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
