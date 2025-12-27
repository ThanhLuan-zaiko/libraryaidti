import React from "react";

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        }`}
                >
                    {tab.icon && <span>{tab.icon}</span>}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
