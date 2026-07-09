import {
    Globe,
    Mic,
    Play,
    Save,
    FolderOpen,
    Bookmark,
    RotateCcw,
    Film,
} from "lucide-react";

const LANGUAGES = [
    { value: "vi", label: "Tiếng Việt" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文 (Trung)" },
    { value: "ja", label: "日本語 (Nhật)" },
    { value: "ko", label: "한국어 (Hàn)" },
];

export default function ExportPanel({
    language,
    setLanguage,
    voice,
    setVoice,
    voiceOptions,
    onPreviewVoice,
    previewing = false,
    onExport,
    isProcessing,
    hasSubtitles,
    onBurnSubtitles,
    isBurning,
    subtitleEnabled = true,
    finalUrl,
    onSaveTemplate,
    onApplyTemplate,
    onReset,
}) {
    return (
        <section className="panel">
            {/* Language + Voice */}
            <div className="two-col">
                <div>
                    <label className="field-label">
                        <Globe size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                        Ngôn ngữ phụ đề
                    </label>
                    <select
                        className="select-input"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {LANGUAGES.map((l) => (
                            <option key={l.value} value={l.value}>
                                {l.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="field-label">
                        <Mic size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                        Giọng đọc thuyết minh
                    </label>
                    <select
                        className="select-input"
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                    >
                        {voiceOptions.map((v) => (
                            <option key={v.value} value={v.value}>
                                {v.label}
                            </option>
                        ))}
                    </select>
                    <button
                        className="btn-listen"
                        onClick={onPreviewVoice}
                        disabled={previewing}
                    >
                        <Play size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                        {previewing ? "Đang phát..." : "Nghe thử giọng"}
                    </button>
                </div>
            </div>

            {/* Bước 1: Xử lý dịch + TTS */}
            <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 18 }}
                onClick={onExport}
                disabled={isProcessing || isBurning}
            >
                <Save size={16} />
                {isProcessing ? "Đang xử lý..." : "Lưu & Xuất video"}
            </button>

            {/* Bước 2: Burn subtitle (chỉ khi đã có subtitles) */}
            {hasSubtitles && (
                <>
                    <p
                        style={{
                            marginTop: 12,
                            marginBottom: 6,
                            fontSize: 12,
                            color: subtitleEnabled ? "var(--muted)" : "#f97316",
                            textAlign: "center",
                        }}
                    >
                        {subtitleEnabled
                            ? "Kéo phụ đề trên video để chỉnh vị trí, sau đó bấm bên dưới"
                            : "⚠ Phụ đề đang TẮT — video sẽ xuất không có phụ đề"}
                    </p>
                    <button
                        className="btn btn-block"
                        style={{
                            background: subtitleEnabled ? "#16a34a" : "#475569",
                            color: "#fff",
                            borderColor: subtitleEnabled ? "#16a34a" : "#475569",
                        }}
                        onClick={onBurnSubtitles}
                        disabled={isBurning || isProcessing}
                    >
                        <Film size={16} />
                        {isBurning
                            ? "Đang ghép phụ đề..."
                            : subtitleEnabled
                                ? "Ghép phụ đề vào video"
                                : "Xuất video (không phụ đề)"}
                    </button>
                </>
            )}

            {/* Template buttons */}
            <div className="btn-row" style={{ marginTop: 10 }}>
                <button className="btn btn-outline" onClick={onSaveTemplate}>
                    <Bookmark size={14} /> Lưu thành template
                </button>
                <button className="btn btn-outline" onClick={onApplyTemplate}>
                    <FolderOpen size={14} /> Áp dụng template
                </button>
            </div>

            {/* Reset link */}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <button className="text-link-reset" onClick={onReset}>
                    <RotateCcw size={13} /> Đặt lại trình chỉnh sửa
                </button>
            </div>

            {finalUrl && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                    <a
                        href={finalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline"
                        download
                    >
                        ⬇ Tải video đã xuất
                    </a>
                </div>
            )}
        </section>
    );
}
