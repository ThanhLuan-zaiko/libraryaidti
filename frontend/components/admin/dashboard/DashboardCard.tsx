"use client";

import React from "react";
import { IconType } from "react-icons";

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    description?: string;
    color?: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
}

const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

export default function DashboardCard({
    title,
    value,
    icon,
    trend,
    description,
    color = "blue",
}: DashboardCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline space-x-1 mt-2">
                        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                    </div>
                </div>
                <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                        {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">{trend.label}</span>
                </div>
            )}
            {description && !trend && (
                <p className="text-xs text-gray-400 mt-4 italic">{description}</p>
            )}
        </div>
    );
}
