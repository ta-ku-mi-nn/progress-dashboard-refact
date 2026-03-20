import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Users, GraduationCap, BookOpen, Map, Library, FileText, BarChart2, Database, FileSearch, Component, ClockAlert } from 'lucide-react';

// コンポーネントのインポート
import UserManagement from '../components/admin/UserManagement';
import StudentManagement from '../components/admin/StudentManagement';
import TextbookManagement from '../components/admin/TextbookManagement';
import RouteTableManagement from '../components/admin/RouteTableManagement';
import PresetManagement from '../components/admin/PresetManagement';
import ChangelogManagement from '../components/admin/ChangelogManagement';
import MockExamList from '../components/admin/MockExamList';
import BackupManagement from '../components/admin/BackupManagement';
import AuditLogViewer from '../components/developer/AuditLogViewer';
import StudyTimeVerification from '../components/admin/StudyTimeverification';
import InactiveUserPopup from '../components/admin/InactiveUserPopup';

export default function Admin() {
    // ★追加: 各機能にポップなテーマカラー(colorClass)を追加！
    const features = [
        { 
            title: "講師管理", icon: Users, description: "講師アカウントの追加・編集・削除", 
            colorClass: "bg-blue-100 text-blue-600", component: <UserManagement /> 
        },
        { 
            title: "生徒管理", icon: GraduationCap, description: "生徒情報の登録・編集", 
            colorClass: "bg-green-100 text-green-600", component: <StudentManagement /> 
        },
        { 
            title: "参考書マスタ管理", icon: BookOpen, description: "参考書データベースの管理", 
            colorClass: "bg-amber-100 text-amber-600", component: <TextbookManagement /> 
        },
        { 
            title: "ルート表管理", icon: Map, description: "学習ルート表（PDF/画像）の管理", 
            colorClass: "bg-purple-100 text-purple-600", component: <RouteTableManagement /> 
        },
        { 
            title: "参考書プリセット管理", icon: Library, description: "一括登録用プリセットの作成", 
            colorClass: "bg-indigo-100 text-indigo-600", component: <PresetManagement /> 
        },
        // { 
        //     title: "リリースノート更新", icon: FileText, description: "更新履歴の追加・編集", 
        //     colorClass: "bg-pink-100 text-pink-600", component: <ChangelogManagement /> 
        // },
        { 
            title: "模試結果一覧", icon: BarChart2, description: "全生徒の模試結果データを閲覧", 
            colorClass: "bg-cyan-100 text-cyan-600", component: <MockExamList /> 
        },
        { 
            title: "監査ログ", icon: FileSearch, description: "進捗更新履歴の確認", 
            colorClass: "bg-slate-200 text-slate-700", component: <AuditLogViewer />
        },
        { 
            title: "予定・実績チェック", icon: ClockAlert, description: "学習時間・予定の違和感を検知", 
            colorClass: "bg-red-100 text-red-600", component: <StudyTimeVerification /> 
        },
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <InactiveUserPopup/>
            {/* ★変更: ヘッダー部分を開発者メニュー風のモダンなスタイルに */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Component className="w-8 h-8 text-blue-600" />
                    管理者コンソール
                </h1>
                <p className="text-gray-500 mt-2">塾の運営に必要な各種データやアカウントを一元管理します。</p>
            </div>
            
            {/* ★変更: グリッドレイアウトとカードデザインをポップな中央揃えに */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {features.map((feature, i) => (
                    <Dialog key={i}>
                        <DialogTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full hover:bg-gray-50/50">
                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className={`p-4 rounded-full ${feature.colorClass}`}>
                                        <feature.icon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{feature.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        
                        {/* ★注意: 管理者画面は表（テーブル）が多いので、max-w-4xl を維持しています */}
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <feature.icon className="w-5 h-5" />
                                    {feature.title}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="pt-4">
                                {feature.component}
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    );
}