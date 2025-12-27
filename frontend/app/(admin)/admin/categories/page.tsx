"use client";

import { useState } from "react";
import Tabs from "@/components/admin/Tabs";
import CategoryAnalytics from "@/components/admin/categories/CategoryAnalytics";
import CategoryManager from "@/components/admin/categories/CategoryManager";
import TagManager from "@/components/admin/tags/TagManager";
import { FiBarChart2, FiFolder, FiTag } from "react-icons/fi";

export default function CategoriesPage() {
    const [activeTab, setActiveTab] = useState("analytics");

    const tabs = [
        { id: "analytics", label: "Phân tích & Thống kê", icon: <FiBarChart2 size={18} /> },
        { id: "categories", label: "Quản lý Danh mục", icon: <FiFolder size={18} /> },
        { id: "tags", label: "Quản lý Thẻ (Tags)", icon: <FiTag size={18} /> },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Nội dung</h1>
                <p className="text-sm text-gray-500">Thống kê và phân loại bài viết theo danh mục và thẻ.</p>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="min-h-[500px]">
                {activeTab === "analytics" && <CategoryAnalytics />}
                {activeTab === "categories" && <CategoryManager />}
                {activeTab === "tags" && <TagManager />}
            </div>
        </div>
    );
}
