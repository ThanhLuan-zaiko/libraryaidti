import { useState, useEffect, useRef } from "react";
import { tagService, Tag } from "@/services/tag.service";

export const useTagLogic = () => {
    // Data States
    const [tags, setTags] = useState<Tag[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total_rows: 0,
        total_pages: 0
    });
    const [loading, setLoading] = useState(true);

    // Sorting State
    const [sortField, setSortField] = useState<string>("name");
    const [sortOrder, setSortOrder] = useState<string>("asc");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (
        page = pagination.page,
        search = searchQuery,
        limit = pagination.limit,
        sort = sortField,
        order = sortOrder
    ) => {
        try {
            setLoading(true);
            const result = await tagService.getList({
                page,
                limit,
                search,
                sort,
                order
            });
            setTags(result.data);
            setPagination(prev => ({
                ...prev,
                page: result.pagination.page,
                limit: result.pagination.limit,
                total_rows: result.pagination.total_rows,
                total_pages: result.pagination.total_pages
            }));
        } catch (error) {
            console.error("Failed to fetch tags:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage !== pagination.page) {
            fetchData(newPage);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            fetchData(1, query); // Reset to page 1 on search
        }, 500);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = parseInt(e.target.value);
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
        fetchData(1, searchQuery, newLimit);
    };

    const handleSort = (field: string) => {
        const newOrder = field === sortField && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(newOrder);
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchData(1, searchQuery, pagination.limit, field, newOrder);
    };

    const refreshData = () => {
        fetchData(pagination.page, searchQuery, pagination.limit, sortField, sortOrder);
    };

    return {
        tags,
        pagination,
        loading,
        searchQuery,
        sortField,
        sortOrder,
        handlePageChange,
        handleSearch,
        handleLimitChange,
        handleSort,
        refreshData
    };
};
