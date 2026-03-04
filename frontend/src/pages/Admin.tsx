import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Users, GraduationCap, BookOpen, Map, Library, FileText, BarChart2, Database, FileSearch, Component } from 'lucide-react';

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
import { title } from 'node:process';

export default function Admin() {
    const features = [
        { title: "講師管理", icon: Users, description: "講師アカウントの追加・編集・削除", component: <UserManagement /> },
        { title: "生徒管理", icon: GraduationCap, description: "生徒情報の登録・編集", component: <StudentManagement /> },
        { title: "参考書マスタ管理", icon: BookOpen, description: "参考書データベースの管理", component: <TextbookManagement /> },
        { title: "ルート表管理", icon: Map, description: "学習ルート表（PDF/画像）の管理", component: <RouteTableManagement /> },
        { title: "参考書プリセット管理", icon: Library, description: "一括登録用プリセットの作成", component: <PresetManagement /> },
        { title: "リリースノート更新", icon: FileText, description: "更新履歴の追加・編集", component: <ChangelogManagement /> },
        { title: "模試結果一覧", icon: BarChart2, description: "全生徒の模試結果データを閲覧", component: <MockExamList /> },
        { title: "監査ログ", icon: FileSearch, description: "進捗更新履歴の確認", Component: <AuditLogViewer />},
//        { title: "データバックアップ", icon: Database, description: "システムデータのダウンロード", component: <BackupManagement /> },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">管理者コンソール</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, i) => (
                    <Dialog key={i}>
                        <DialogTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full hover:bg-gray-50/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
                                    <feature.icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold"></div>
                                    <p className="text-xs text-muted-foreground mt-2">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
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
