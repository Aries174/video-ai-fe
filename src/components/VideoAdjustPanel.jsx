import {
    Play,
    Music,
    Crop,
    ZoomIn,
    Image as ImageIcon,
    Sparkles,
} from "lucide-react";
import UploadBox from "./UploadBox";
import Toggle from "./Toggle";

const ASPECTS = [
    { key: "9 / 16", title: "9:16 Dọc", subtitle: "(Short)" },
    { key: "16 / 9", title: "16:9 Ngang", subtitle: "" },
];

export default function VideoAdjustPanel({
    logoFile,
    setLogoFile,
    musicFile,
    setMusicFile,
    aspectRatio,
    setAspectRatio,
    keepOriginalAudio,
    setKeepOriginalAudio,
    audioMode,
    setAudioMode,
    originalVolume,
    setOriginalVolume,
    removeWatermark,
    setRemoveWatermark,
    zoomCrop,
    setZoomCrop,
}) {
    return (
        <section className="panel">
            <div className="panel-header">
                <div>
                    <h3 className="panel-title">
                        <Play size={16} color="#3b6cf6" /> Bảng điều chỉnh video
                    </h3>
                    <p className="panel-subtitle">Tinh chỉnh video đầu ra theo ý bạn</p>
                </div>
            </div>

            {/* Row 1: Logo / Music / Aspect */}
            <div className="three-col" style={{ marginTop: 4 }}>
                <div>
                    <label className="field-label">
                        <ImageIcon size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                        Logo thương hiệu
                    </label>
                    <UploadBox
                        label="Click để tải logo lên"
                        accept="image/*"
                        file={logoFile}
                        onFileSelected={setLogoFile}
                    />
                </div>
                <div>
                    <label className="field-label">
                        <Music size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                        Nhạc nền (file MP3)
                    </label>
                    <UploadBox
                        label="Click để tải nhạc MP3"
                        accept="audio/mpeg,audio/mp3"
                        file={musicFile}
                        onFileSelected={setMusicFile}
                    />
                </div>
                <div>
                    <label className="field-label">
                        <Crop size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                        Tỉ lệ khung hình
                    </label>
                    <div className="aspect-group">
                        {ASPECTS.map((a) => (
                            <button
                                key={a.key}
                                type="button"
                                className={`aspect-btn ${aspectRatio === a.key ? "active" : ""}`}
                                onClick={() => setAspectRatio(a.key)}
                            >
                                <span className="aspect-title">{a.title}</span>
                                <span>{a.subtitle}</span>
                            </button>
                        ))}
                    </div>
                    <p
                        style={{
                            fontSize: 11.5,
                            color: "var(--muted)",
                            marginTop: 6,
                            marginBottom: 0,
                        }}
                    >
                        Chọn 9:16 cho TikTok/Reels, 16:9 cho YouTube
                    </p>
                </div>
            </div>

            {/* Row 2: Audio / Watermark / Zoom */}
            <div className="three-col">
                {/* Audio */}
                <div className="subcard">
                    <div className="row-between">
                        <span className="label-strong">
                            🔊 Giữ âm thanh gốc
                            <br />
                            <span
                                style={{ fontWeight: 400, fontSize: 12, color: "var(--muted)" }}
                            >
                                của video
                            </span>
                        </span>
                        <Toggle
                            checked={keepOriginalAudio}
                            onChange={setKeepOriginalAudio}
                        />
                    </div>
                    <div className="audio-options" style={{ marginTop: 10 }}>
                        <label className="radio-line">
                            <input
                                type="radio"
                                name="audio-mode"
                                checked={audioMode === "all"}
                                onChange={() => setAudioMode("all")}
                                disabled={!keepOriginalAudio}
                            />
                            <span>
                                Giữ toàn bộ âm thanh gốc
                                <br />
                                <span style={{ color: "var(--muted)", fontSize: 11.5 }}>
                                    (giọng nói + nhạc)
                                </span>
                            </span>
                        </label>
                        <label className="radio-line">
                            <input
                                type="radio"
                                name="audio-mode"
                                checked={audioMode === "music"}
                                onChange={() => setAudioMode("music")}
                                disabled={!keepOriginalAudio}
                            />
                            <span>
                                Chỉ giữ nhạc nền (loại bỏ
                                <br />
                                giọng nói)
                            </span>
                        </label>
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <label className="field-label">
                            Âm lượng tiếng gốc ({Math.round(originalVolume * 100)}%)
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={1.5}
                            step={0.05}
                            value={originalVolume}
                            onChange={(e) => setOriginalVolume(parseFloat(e.target.value))}
                            className="range-slider"
                            disabled={!keepOriginalAudio}
                        />
                        <div
                            style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                marginTop: 4,
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>Tối thiểu: 0</span>
                            <span>Tối đa: 1.5x</span>
                        </div>
                    </div>
                </div>

                {/* Xóa chữ Trung */}
                <div className="subcard">
                    <div className="row-between">
                        <span
                            className="label-strong"
                            style={{ display: "flex", alignItems: "flex-start" }}
                        >
                            <Sparkles
                                size={14}
                                style={{ marginRight: 4, color: "#e11d48" }}
                            />
                            <span>
                                Xóa chữ Trung
                                <br />
                                <span style={{ fontWeight: 400, fontSize: 12, color: "var(--muted)" }}>
                                    watermark gốc
                                </span>
                            </span>
                        </span>
                        <Toggle checked={removeWatermark} onChange={setRemoveWatermark} />
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
                        Bật để AI tự động xóa text tiếng Trung khỏi video
                    </div>
                </div>

                {/* Zoom */}
                <div className="subcard">
                    <div className="row-between">
                        <span className="label-strong">
                            <ZoomIn size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                            Phóng to khung hình
                            <br />
                            <span
                                style={{ fontWeight: 400, fontSize: 12, color: "var(--muted)" }}
                            >
                                (zoom crop)
                            </span>
                        </span>
                        <span
                            style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
                        >
                            {zoomCrop.toFixed(2)}x
                        </span>
                    </div>
                    <div style={{ marginTop: 18 }}>
                        <input
                            type="range"
                            min={0.75}
                            max={1.5}
                            step={0.01}
                            value={zoomCrop}
                            onChange={(e) => setZoomCrop(parseFloat(e.target.value))}
                            className="range-slider"
                        />
                        <div
                            style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                marginTop: 4,
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>0.75x</span>
                            <span>Tránh trùng bản quyền</span>
                            <span>1.5x</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
