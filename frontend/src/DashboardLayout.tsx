import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';
import { LogOut, Home, BookOpen, BarChart2, Settings, Map, ScrollText, MessagesSquare } from 'lucide-react';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'ダッシュボード', path: '/', icon: Home },
        { name: '過去問/模試/入試日程', path: '/past-exam', icon: BookOpen },
        { name: 'ルート表', path: '/root-table', icon: Map }, 
        { name: '統計', path: '/statistics', icon: BarChart2 },
        { name: 'バグ報告/要望', path: '/bug-report', icon: MessagesSquare },
        { name: '更新履歴', path: '/changelog', icon: ScrollText },
    ];

    if (user?.role === 'admin') {
        navItems.push({ name: '管理者ページ', path: '/admin', icon: Settings });
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-800">Learning DB</h1>
                    <p className="text-sm text-gray-500 mt-1">ようこそ、{user?.username}</p>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100",
                                location.pathname === item.path && "bg-gray-100 font-medium text-primary"
                            )}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50" onClick={logout}>
                        <LogOut className="w-5 h-5 mr-3" />
                        ログアウト
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}
