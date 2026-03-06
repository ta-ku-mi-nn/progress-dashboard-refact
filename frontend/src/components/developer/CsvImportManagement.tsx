import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info, X } from 'lucide-react';

// --- Canvasプレビュー用 UIコンポーネントのモック ---
const Card = ({ children, className = '' }: any) => (
  <div className={`rounded-xl border bg-white shadow ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }: any) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, disabled, variant = 'default', className = '', ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2";
  const variants: any = {
    default: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-gray-300 hover:bg-gray-100 bg-white text-gray-700"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Canvasプレビュー用 APIモック
const api = {
    post: async (url: string, data: any, config: any) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ data: { message: "インポートが完了しました！\n新規追加: 12件\nデータ更新: 3件" } });
            }, 1500);
        });
    }
};
// --------------------------------------------------

// インポート種別ごとのフォーマット案内
const FORMAT_GUIDES = {
    textbook: {
        label: "参考書マスタ",
        headers: "subject, level, book_name, duration",
        example: "英語, 基礎徹底, ターゲット1900, 30.5"
    },
    student: {
        label: "生徒データ",
        headers: "name, grade, branch_id, deviation_value",
        example: "山田太郎, 高3, 1, 55.0"
    },
    user: {
        label: "講師(ユーザー)データ",
        headers: "username, name, role, branch_id",
        example: "suzuki_t, 鈴木一郎, admin, 1"
    }
} as const;

type ImportType = keyof typeof FORMAT_GUIDES;

export default function CsvImportManagement() {
    const [importType, setImportType] = useState<ImportType>("textbook");
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // 結果表示用ステート
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ファイル選択処理
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            resetMessages();
        }
    };

    // ドラッグ＆ドロップ処理
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // CSVファイルのみ受け付ける簡易チェック
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
                setFile(droppedFile);
                resetMessages();
            } else {
                setErrorMsg("CSVファイルのみアップロード可能です。");
            }
        }
    };

    const resetMessages = () => {
        setSuccessMsg(null);
        setErrorMsg(null);
    };

    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        resetMessages();
    };

    // アップロード実行
    const handleUpload = async () => {
        if (!file) {
            setErrorMsg("ファイルが選択されていません。");
            return;
        }

        setLoading(true);
        resetMessages();

        const formData = new FormData();
        formData.append("import_type", importType);
        formData.append("file", file);

        try {
            // モックAPIを叩く
            const response = await api.post('/csv/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccessMsg((response as any).data.message || "インポートが完了しました！");
            setFile(null); // 成功したらファイルをクリア
            if (fileInputRef.current) fileInputRef.current.value = "";

        } catch (error: any) {
            console.error("Upload Error:", error);
            if (error.response && error.response.data && error.response.data.detail) {
                setErrorMsg(error.response.data.detail);
            } else {
                setErrorMsg("サーバーとの通信に失敗しました。ファイルサイズやネットワークを確認してください。");
            }
        } finally {
            setLoading(false);
        }
    };

    const currentGuide = FORMAT_GUIDES[importType];

    return (
        <div className="space-y-6">
            {/* 上部: 設定とフォーマット案内 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-emerald-100 shadow-sm">
                    <CardHeader className="pb-3 bg-emerald-50/50 rounded-t-xl">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            インポート設定
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">登録するデータ種別</label>
                            {/* Selectコンポーネントの代わりにネイティブのselectを使用して依存を解消 */}
                            <select 
                                value={importType} 
                                onChange={(e) => {
                                    setImportType(e.target.value as ImportType);
                                    resetMessages();
                                }}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="textbook">参考書マスタ</option>
                                <option value="student">生徒データ</option>
                                <option value="user">講師(ユーザー)データ</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-500">
                            ※ 同じ名前（一意キー）のデータが既に存在する場合は、自動的に内容が「上書き更新」されます。
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            必須CSVフォーマット（1行目）
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-white p-3 rounded border border-blue-100 font-mono text-sm overflow-x-auto text-gray-800 shadow-inner">
                            {currentGuide.headers}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-blue-700">入力例:</span>
                            <div className="text-xs text-gray-600 mt-1 font-mono bg-white p-2 rounded border border-gray-100">
                                {currentGuide.example}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 下部: ドロップエリア */}
            <Card className="shadow-sm">
                <CardContent className="p-6">
                    <div 
                        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                            isDragging 
                                ? "border-emerald-500 bg-emerald-50 scale-[1.01]" 
                                : file ? "border-indigo-300 bg-indigo-50/30" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {!file ? (
                            <>
                                <div className="p-4 bg-white rounded-full shadow-sm mb-4 border border-gray-100">
                                    <UploadCloud className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">CSVファイルをドラッグ＆ドロップ</h3>
                                <p className="text-sm text-gray-500 mb-6">または、下のボタンからファイルを選択してください</p>
                                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="bg-white">
                                    ファイルを選択
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-white rounded-full shadow-sm mb-4 border border-indigo-100">
                                    <FileSpreadsheet className="w-10 h-10 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{file.name}</h3>
                                <p className="text-sm text-gray-500 mb-6">{(file.size / 1024).toFixed(1)} KB</p>
                                <div className="flex gap-3">
                                    <Button onClick={clearFile} variant="outline" className="bg-white text-gray-600" disabled={loading}>
                                        <X className="w-4 h-4 mr-1" /> キャンセル
                                    </Button>
                                    <Button onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                                        {loading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 処理中...</>
                                        ) : (
                                            <><UploadCloud className="w-4 h-4 mr-2" /> インポート実行</>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* メッセージ表示エリア */}
                    {errorMsg && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="text-sm whitespace-pre-wrap font-medium">{errorMsg}</div>
                        </div>
                    )}
                    
                    {successMsg && (
                        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="text-sm whitespace-pre-wrap font-bold">{successMsg}</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}