import { Type, Plus, Trash2 } from "lucide-react";
import Toggle from "./Toggle";

const FONT_OPTIONS = [
    "Arial",
    "Roboto",
    "Inter",
    "Times New Roman",
    "Verdana",
    "Tahoma",
    "Georgia",
    "Courier New",
];

export default function SubtitlePanel({
    subtitleConfig,
    setSubtitleConfig,
    textBoxes,
    onAddTextBox,
    setTextBoxes,
}) {
    const update = (patch) => setSubtitleConfig((p) => ({ ...p, ...patch }));
    const cfg = subtitleConfig;

    const updateTextBox = (id, patch) =>
        setTextBoxes?.((prev) => prev.map((tb) => tb.id === id ? { ...tb, ...patch } : tb));

    const removeTextBox = (id) =>
        setTextBoxes?.((prev) => prev.filter((tb) => tb.id !== id));

    return (
        <section className="panel">
            <div className="row-between" style={{ marginBottom: 12 }}>
                <h3 className="panel-title">
                    <Type size={16} color="#3b6cf6" /> Hiển thị phụ đề (subtitle)
                </h3>
                <Toggle
                    checked={cfg.enabled}
                    onChange={(v) => update({ enabled: v })}
                />
            </div>

            {/* Color row */}
            <div className="two-col">
                <div>
                    <label className="field-label">Màu chữ phụ đề</label>
                    <div className="color-input">
                        <input
                            type="color"
                            value={cfg.textColor}
                            onChange={(e) => update({ textColor: e.target.value })}
                            disabled={!cfg.enabled}
                        />
                        <input
                            type="text"
                            className="input-text"
                            value={cfg.textColor.toUpperCase()}
                            onChange={(e) => update({ textColor: e.target.value })}
                            disabled={!cfg.enabled}
                        />
                    </div>
                </div>
                <div>
                    <label className="field-label">Màu nền text box</label>
                    <div className="color-input">
                        <input
                            type="color"
                            value={cfg.bgColor}
                            onChange={(e) => update({ bgColor: e.target.value })}
                            disabled={!cfg.enabled}
                        />
                        <input
                            type="text"
                            className="input-text"
                            value={cfg.bgColor.toUpperCase()}
                            onChange={(e) => update({ bgColor: e.target.value })}
                            disabled={!cfg.enabled}
                        />
                    </div>
                </div>
            </div>

            {/* Show bg toggle */}
            <div
                className="row-between"
                style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                }}
            >
                <span style={{ fontSize: 13 }}>Hiển thị nền cho box chữ</span>
                <Toggle
                    checked={cfg.showBg}
                    onChange={(v) => update({ showBg: v })}
                    disabled={!cfg.enabled}
                />
            </div>

            {/* Background opacity */}
            <div style={{ marginTop: 14 }}>
                <label className="field-label">
                    Độ trong suốt nền ({Math.round(cfg.bgOpacity * 100)}%)
                </label>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={cfg.bgOpacity}
                    onChange={(e) => update({ bgOpacity: parseFloat(e.target.value) })}
                    className="range-slider"
                    disabled={!cfg.enabled || !cfg.showBg}
                />
                <p className="helper-text">0% = trong suốt hoàn toàn, 100% = đặc</p>
            </div>

            {/* Font size */}
            <div style={{ marginTop: 12 }}>
                <label className="field-label">Cỡ chữ phụ đề</label>
                <input
                    type="range"
                    min={10}
                    max={80}
                    step={1}
                    value={cfg.fontSize}
                    onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
                    className="range-slider"
                    disabled={!cfg.enabled}
                />
                <p className="helper-text">{cfg.fontSize}px</p>
            </div>

            {/* Box width */}
            <div style={{ marginTop: 8 }}>
                <label className="field-label">
                    Độ rộng box phụ đề ({cfg.boxWidth}px)
                </label>
                <input
                    type="range"
                    min={100}
                    max={1000}
                    step={10}
                    value={cfg.boxWidth}
                    onChange={(e) => update({ boxWidth: parseInt(e.target.value) })}
                    className="range-slider"
                    disabled={!cfg.enabled}
                />
            </div>

            {/* Box height */}
            <div style={{ marginTop: 8 }}>
                <label className="field-label">
                    Chiều cao box phụ đề ({cfg.boxHeight}px)
                </label>
                <input
                    type="range"
                    min={20}
                    max={300}
                    step={1}
                    value={cfg.boxHeight}
                    onChange={(e) => update({ boxHeight: parseInt(e.target.value) })}
                    className="range-slider"
                    disabled={!cfg.enabled}
                />
            </div>

            {/* Border radius */}
            <div style={{ marginTop: 8 }}>
                <label className="field-label">
                    Độ bo góc box phụ đề ({cfg.borderRadius}px)
                </label>
                <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={cfg.borderRadius}
                    onChange={(e) => update({ borderRadius: parseInt(e.target.value) })}
                    className="range-slider"
                    disabled={!cfg.enabled}
                />
                <p className="helper-text">0 = vuông góc, 30 = bo tròn nhiều</p>
            </div>

            {/* Font */}
            <div style={{ marginTop: 12 }}>
                <label className="field-label">Kiểu chữ (font)</label>
                <select
                    className="select-input"
                    value={cfg.fontFamily}
                    onChange={(e) => update({ fontFamily: e.target.value })}
                    disabled={!cfg.enabled}
                >
                    {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>

            {/* Text box tự do */}
            <div style={{ marginTop: 16 }}>
                <div
                    className="row-between"
                    style={{ alignItems: "center", marginBottom: 8 }}
                >
                    <span className="label-strong">
                        📝 Text box tự do ({textBoxes.length})
                    </span>
                    <button className="btn btn-purple" onClick={onAddTextBox}>
                        <Plus size={13} /> Thêm
                    </button>
                </div>

                {textBoxes.length === 0 ? (
                    <p className="muted-italic" style={{ margin: 0 }}>
                        Chưa có text box. Bấm "Thêm" để tạo. Trên video: kéo để di chuyển, double-click để sửa nội dung, kéo góc vàng để resize.
                    </p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {textBoxes.map((tb, i) => (
                            <div
                                key={tb.id}
                                style={{
                                    border: "1px solid var(--border)",
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                    background: "var(--surface, #f8fafc)",
                                }}
                            >
                                {/* Header row */}
                                <div className="row-between" style={{ marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
                                        Text Box #{i + 1}
                                    </span>
                                    <button
                                        className="btn"
                                        style={{ padding: "2px 8px", fontSize: 11, color: "#ef4444", borderColor: "#ef4444", background: "transparent" }}
                                        onClick={() => removeTextBox(tb.id)}
                                    >
                                        <Trash2 size={11} /> Xóa
                                    </button>
                                </div>

                                {/* Text content */}
                                <div style={{ marginBottom: 8 }}>
                                    <label className="field-label">Nội dung</label>
                                    <textarea
                                        value={tb.text}
                                        onChange={(e) => updateTextBox(tb.id, { text: e.target.value })}
                                        rows={2}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "6px 8px",
                                            borderRadius: 6,
                                            border: "1px solid var(--border)",
                                            fontSize: 13,
                                            resize: "vertical",
                                            fontFamily: "inherit",
                                            background: "var(--input-bg, #fff)",
                                            color: "var(--text)",
                                        }}
                                    />
                                </div>

                                {/* Color + Font size row */}
                                <div className="two-col" style={{ marginBottom: 8 }}>
                                    <div>
                                        <label className="field-label">Màu chữ</label>
                                        <div className="color-input">
                                            <input
                                                type="color"
                                                value={tb.color || "#ffffff"}
                                                onChange={(e) => updateTextBox(tb.id, { color: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="input-text"
                                                value={(tb.color || "#ffffff").toUpperCase()}
                                                onChange={(e) => updateTextBox(tb.id, { color: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="field-label">Cỡ chữ ({tb.fontSize || 18}px)</label>
                                        <input
                                            type="range"
                                            min={10}
                                            max={80}
                                            step={1}
                                            value={tb.fontSize || 18}
                                            onChange={(e) => updateTextBox(tb.id, { fontSize: parseInt(e.target.value) })}
                                            className="range-slider"
                                        />
                                    </div>
                                </div>

                                {/* Background row */}
                                <div
                                    className="row-between"
                                    style={{
                                        padding: "8px 10px",
                                        border: "1px solid var(--border)",
                                        borderRadius: 6,
                                        marginBottom: 8,
                                    }}
                                >
                                    <span style={{ fontSize: 12 }}>Hiển thị nền</span>
                                    <Toggle
                                        checked={tb.showBg !== false}
                                        onChange={(v) => updateTextBox(tb.id, { showBg: v })}
                                    />
                                </div>

                                {tb.showBg !== false && (
                                    <div className="two-col" style={{ marginBottom: 8 }}>
                                        <div>
                                            <label className="field-label">Màu nền</label>
                                            <div className="color-input">
                                                <input
                                                    type="color"
                                                    value={tb.bgColor || "#000000"}
                                                    onChange={(e) => updateTextBox(tb.id, { bgColor: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    className="input-text"
                                                    value={(tb.bgColor || "#000000").toUpperCase()}
                                                    onChange={(e) => updateTextBox(tb.id, { bgColor: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="field-label">
                                                Độ mờ nền ({Math.round((tb.bgOpacity ?? 0.7) * 100)}%)
                                            </label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={tb.bgOpacity ?? 0.7}
                                                onChange={(e) => updateTextBox(tb.id, { bgOpacity: parseFloat(e.target.value) })}
                                                className="range-slider"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Font family */}
                                <div>
                                    <label className="field-label">Kiểu chữ</label>
                                    <select
                                        className="select-input"
                                        value={tb.fontFamily || "Times New Roman"}
                                        onChange={(e) => updateTextBox(tb.id, { fontFamily: e.target.value })}
                                    >
                                        {FONT_OPTIONS.map((f) => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>

                                <p className="muted-italic" style={{ margin: "8px 0 0", fontSize: 11 }}>
                                    🖱 Kéo để di chuyển · Kéo góc vàng để resize · Double-click để sửa nhanh
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}