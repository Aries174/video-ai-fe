import { useRef, useEffect, useState, useCallback } from "react";
import { Upload, Download } from "lucide-react";

export default function PreviewArea({
    videoUrl,
    videoRef,
    aspectRatio,
    onMetadata,
    onTimeUpdate,
    subtitleConfig,
    setSubtitleConfig,
    subtitles = [],
    setSubtitles,
    selectedSubIndex,
    setSelectedSubIndex,
    logoMeta,
    setLogoMeta,
    onPickVideo,
    jobStatus,
    jobProgress,
    finalUrl,
    textBoxes = [],
    setTextBoxes,
    setAllSubtitlesPosition,
}) {
    const fileRef = useRef(null);
    const wrapperRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [contentRect, setContentRect] = useState(null);
    const [videoReady, setVideoReady] = useState(false);

    // Drag state: { mode, target?, ...startData }
    const [dragging, setDragging] = useState(null);

    // Text box editing
    const [editingTextBoxId, setEditingTextBoxId] = useState(null);
    const [selectedTextBoxId, setSelectedTextBoxId] = useState(null);
    const editInputRef = useRef(null);

    const cfg = subtitleConfig;

    // ===== Tính content rect (vùng video thật bên trong wrapper, đã trừ letterbox) =====
    const calcContentRect = useCallback(() => {
        const wrapper = wrapperRef.current;
        const video = videoRef.current;
        if (!wrapper || !video || !video.videoWidth) return null;

        const wRect = wrapper.getBoundingClientRect();
        const vRatio = video.videoWidth / video.videoHeight;
        const wRatio = wRect.width / wRect.height;

        let cw;
        let ch;
        let ox = 0;
        let oy = 0;
        if (wRatio > vRatio) {
            ch = wRect.height;
            cw = ch * vRatio;
            ox = (wRect.width - cw) / 2;
        } else {
            cw = wRect.width;
            ch = cw / vRatio;
            oy = (wRect.height - ch) / 2;
        }
        return { left: ox, top: oy, width: cw, height: ch };
    }, [videoRef]);

    useEffect(() => {
        if (!videoReady) return;
        const id = requestAnimationFrame(() => {
            setContentRect(calcContentRect());
        });
        return () => cancelAnimationFrame(id);
    }, [videoReady, calcContentRect]);

    useEffect(() => {
        let t;
        const onResize = () => {
            clearTimeout(t);
            t = setTimeout(() => {
                if (videoReady) setContentRect(calcContentRect());
            }, 80);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [videoReady, calcContentRect]);

    // ===== Subtitle drag/resize =====
    const handleSubMouseDown = (e, index, mode) => {
        e.stopPropagation();
        e.preventDefault();
        if (!contentRect) return;

        setSelectedSubIndex?.(index);
        const sub = subtitles[index];
        if (!sub) return;

        const wRect = wrapperRef.current.getBoundingClientRect();
        const subLeft = contentRect.left + (sub.x ?? 0.5) * contentRect.width;
        const subTop = contentRect.top + (sub.y ?? 0.85) * contentRect.height;

        setDragging({
            target: "sub",
            index,
            mode,
            startMouseX: e.clientX - wRect.left,
            startMouseY: e.clientY - wRect.top,
            startSubLeft: subLeft,
            startSubTop: subTop,
            startBoxW: cfg?.boxWidth ?? 300,
            startBoxH: cfg?.boxHeight ?? 50,
            startFontSize: cfg?.fontSize ?? 32,
        });
    };

    // ===== Text Box drag/resize =====
    const handleTextBoxMouseDown = (e, id, mode) => {
        e.stopPropagation();
        e.preventDefault();
        if (!contentRect) return;
        if (editingTextBoxId === id) return; // don't drag while editing

        setSelectedTextBoxId(id);
        const tb = textBoxes.find((t) => t.id === id);
        if (!tb) return;

        const wRect = wrapperRef.current.getBoundingClientRect();
        const tbLeft = contentRect.left + tb.x * contentRect.width;
        const tbTop = contentRect.top + tb.y * contentRect.height;

        setDragging({
            target: "textbox",
            id,
            mode,
            startMouseX: e.clientX - wRect.left,
            startMouseY: e.clientY - wRect.top,
            startLeft: tbLeft,
            startTop: tbTop,
            startW: tb.width ?? 0.25,
            startH: tb.height ?? 0.08,
        });
    };

    const handleTextBoxDoubleClick = (e, id) => {
        e.stopPropagation();
        setEditingTextBoxId(id);
        setSelectedTextBoxId(id);
        setTimeout(() => editInputRef.current?.focus(), 30);
    };

    const commitTextEdit = () => setEditingTextBoxId(null);

    // ===== Logo drag/resize =====
    const handleLogoMouseDown = (e, mode) => {
        e.stopPropagation();
        e.preventDefault();
        if (!contentRect || !logoMeta) return;

        const wRect = wrapperRef.current.getBoundingClientRect();
        const logoLeft = contentRect.left + logoMeta.x * contentRect.width;
        const logoTop = contentRect.top + logoMeta.y * contentRect.height;

        setDragging({
            target: "logo",
            mode,
            startMouseX: e.clientX - wRect.left,
            startMouseY: e.clientY - wRect.top,
            startLogoLeft: logoLeft,
            startLogoTop: logoTop,
            startLogoW: logoMeta.width,
            startLogoH: logoMeta.height,
        });
    };

    // Listen on window for smoother drag
    useEffect(() => {
        if (!dragging || !contentRect) return;

        const handleMove = (e) => {
            const wRect = wrapperRef.current?.getBoundingClientRect();
            if (!wRect) return;

            const mx = e.clientX - wRect.left;
            const my = e.clientY - wRect.top;
            const dx = mx - dragging.startMouseX;
            const dy = my - dragging.startMouseY;

            // ─── Subtitle ───────────────────────────────
            if (dragging.target === "sub") {
                if (dragging.mode === "move") {
                    // Áp vị trí mới cho TẤT CẢ subtitle từ câu đang kéo trở đi.
                    // Cách này tự nhiên cho subtitle: thường mọi câu cùng vị trí —
                    // user chỉ cần chỉnh 1 lần, các câu sau tự bám theo.
                    const newLeft = dragging.startSubLeft + dx;
                    const newTop = dragging.startSubTop + dy;
                    const newX = Math.max(
                        0,
                        Math.min(1, (newLeft - contentRect.left) / contentRect.width),
                    );
                    const newY = Math.max(
                        0,
                        Math.min(1, (newTop - contentRect.top) / contentRect.height),
                    );
                    setSubtitles?.((prev) =>
                        prev.map((sub, i) =>
                            i >= dragging.index ? { ...sub, x: newX, y: newY } : sub,
                        ),
                    );
                    return;
                }
                if (dragging.mode === "resize-se") {
                    const newW = Math.max(
                        80,
                        Math.min(2000, Math.round(dragging.startBoxW + dx * 2)),
                    );
                    const newH = Math.max(
                        20,
                        Math.min(400, Math.round(dragging.startBoxH + dy * 2)),
                    );
                    setSubtitleConfig?.((p) => ({
                        ...p,
                        boxWidth: newW,
                        boxHeight: newH,
                    }));
                    return;
                }
                if (dragging.mode === "resize-font") {
                    const ratio = 1 + dx / 200;
                    const newSize = Math.max(
                        10,
                        Math.min(120, Math.round(dragging.startFontSize * ratio)),
                    );
                    setSubtitleConfig?.((p) => ({ ...p, fontSize: newSize }));
                    return;
                }
                return;
            }

            // ─── Text Box ───────────────────────────────
            if (dragging.target === "textbox") {
                if (dragging.mode === "move") {
                    const newLeft = dragging.startLeft + dx;
                    const newTop = dragging.startTop + dy;
                    const newX = Math.max(0, Math.min(1, (newLeft - contentRect.left) / contentRect.width));
                    const newY = Math.max(0, Math.min(1, (newTop - contentRect.top) / contentRect.height));
                    setTextBoxes?.((prev) =>
                        prev.map((tb) => tb.id === dragging.id ? { ...tb, x: newX, y: newY } : tb)
                    );
                    return;
                }
                if (dragging.mode === "resize") {
                    const newW = Math.max(0.05, Math.min(0.95, dragging.startW + dx / contentRect.width));
                    const newH = Math.max(0.03, Math.min(0.5, dragging.startH + dy / contentRect.height));
                    setTextBoxes?.((prev) =>
                        prev.map((tb) => tb.id === dragging.id ? { ...tb, width: newW, height: newH } : tb)
                    );
                    return;
                }
            }

            // ─── Logo ───────────────────────────────────
            if (dragging.target === "logo") {
                if (dragging.mode === "move") {
                    const newLeft = dragging.startLogoLeft + dx;
                    const newTop = dragging.startLogoTop + dy;
                    setLogoMeta?.((prev) =>
                        prev
                            ? {
                                ...prev,
                                x: Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        (newLeft - contentRect.left) / contentRect.width,
                                    ),
                                ),
                                y: Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        (newTop - contentRect.top) / contentRect.height,
                                    ),
                                ),
                            }
                            : prev,
                    );
                    return;
                }
                if (dragging.mode === "resize") {
                    // resize bottom-right: tăng w/h theo delta chuột (đối xứng nhẹ)
                    const newW = Math.max(
                        0.04,
                        Math.min(0.6, dragging.startLogoW + dx / contentRect.width),
                    );
                    const newH = Math.max(
                        0.04,
                        Math.min(0.6, dragging.startLogoH + dy / contentRect.height),
                    );
                    setLogoMeta?.((prev) =>
                        prev ? { ...prev, width: newW, height: newH } : prev,
                    );
                    return;
                }
            }
        };

        const handleUp = () => setDragging(null);

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [dragging, contentRect, setSubtitles, setSubtitleConfig, setLogoMeta, setTextBoxes]);

    // Subtitle hiện tại theo currentTime
    const activeIndex = subtitles.findIndex(
        (s) => currentTime >= s.start && currentTime <= s.end,
    );
    const showIndex = activeIndex !== -1 ? activeIndex : selectedSubIndex ?? 0;
    const activeSub = subtitles[showIndex];

    // ===== Style cho subtitle box =====
    const bgRgba = (() => {
        if (!cfg?.showBg) return "transparent";
        const hex = (cfg?.bgColor || "#000000").replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${cfg?.bgOpacity ?? 1})`;
    })();

    const displayUrl = finalUrl || videoUrl;

    const subtitleBoxStyle =
        activeSub && contentRect && cfg
            ? {
                position: "absolute",
                left: contentRect.left + (activeSub.x ?? 0.5) * contentRect.width,
                top: contentRect.top + (activeSub.y ?? 0.85) * contentRect.height,
                transform: "translate(-50%, -50%)",
                background: bgRgba,
                color: cfg.textColor || "#ffffff",
                fontFamily: cfg.fontFamily || "Arial",
                fontSize: `${cfg.fontSize ?? 21}px`,
                padding: "8px 14px",
                borderRadius: cfg.borderRadius ?? 4,
                border:
                    selectedSubIndex === showIndex
                        ? "2px dashed #3b6cf6"
                        : "2px solid transparent",
                cursor:
                    dragging?.target === "sub" && dragging?.mode === "move"
                        ? "grabbing"
                        : "grab",
                width: `${cfg.boxWidth ?? 300}px`,
                minHeight: `${cfg.boxHeight ?? 50}px`,
                maxWidth: `${cfg.boxWidth ?? 300}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                wordBreak: "break-word",
                whiteSpace: "normal",
                overflow: "hidden",
                zIndex: 10,
                fontWeight: 600,
                lineHeight: 1.2,
                boxSizing: "border-box",
            }
            : null;

    return (
        <div className="preview-card">
            <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="file-hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickVideo?.(f);
                }}
            />

            {displayUrl ? (
                <div
                    ref={wrapperRef}
                    className="video-preview-wrapper"
                    style={{
                        aspectRatio,
                        position: "relative",
                        userSelect: "none",
                        minHeight: aspectRatio === "16 / 9" ? 260 : 320,
                    }}
                >
                    <video
                        key={displayUrl}
                        ref={videoRef}
                        src={displayUrl}
                        controls
                        className="video-preview"
                        onLoadedMetadata={(e) => {
                            setVideoReady(true);
                            onMetadata?.(e);
                        }}
                        onTimeUpdate={(e) => {
                            setCurrentTime(e.currentTarget.currentTime);
                            onTimeUpdate?.(e);
                        }}
                    />

                    {/* ===== Logo overlay (drag/resize) ===== */}
                    {!finalUrl && logoMeta && contentRect && (
                        <div
                            onMouseDown={(e) => handleLogoMouseDown(e, "move")}
                            style={{
                                position: "absolute",
                                left: contentRect.left + logoMeta.x * contentRect.width,
                                top: contentRect.top + logoMeta.y * contentRect.height,
                                transform: "translate(-50%, -50%)",
                                width: `${logoMeta.width * contentRect.width}px`,
                                height: `${logoMeta.height * contentRect.height}px`,
                                cursor:
                                    dragging?.target === "logo" && dragging?.mode === "move"
                                        ? "grabbing"
                                        : "grab",
                                border: "2px dashed rgba(59, 108, 246, 0.7)",
                                zIndex: 11,
                                boxSizing: "border-box",
                            }}
                            title="Kéo để di chuyển logo"
                        >
                            <img
                                src={logoMeta.url}
                                alt="logo"
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            />
                            {/* Resize handle góc phải-dưới */}
                            <div
                                onMouseDown={(e) => handleLogoMouseDown(e, "resize")}
                                title="Kéo để chỉnh kích thước logo"
                                style={{
                                    position: "absolute",
                                    right: -7,
                                    bottom: -7,
                                    width: 14,
                                    height: 14,
                                    background: "#fff",
                                    border: "2px solid #3b6cf6",
                                    borderRadius: "50%",
                                    cursor: "nwse-resize",
                                }}
                            />
                        </div>
                    )}

                    {/* ===== Subtitle live preview ===== */}
                    {!finalUrl &&
                        cfg?.enabled &&
                        contentRect &&
                        activeSub &&
                        subtitles.length > 0 && (
                            <div
                                onMouseDown={(e) => handleSubMouseDown(e, showIndex, "move")}
                                style={subtitleBoxStyle}
                            >
                                <span style={{ pointerEvents: "none" }}>
                                    {activeSub.text || "..."}
                                </span>

                                {/* Resize handle bottom-right (box width + height) */}
                                <div
                                    onMouseDown={(e) =>
                                        handleSubMouseDown(e, showIndex, "resize-se")
                                    }
                                    title="Kéo để chỉnh kích thước nền"
                                    style={{
                                        position: "absolute",
                                        right: -7,
                                        bottom: -7,
                                        width: 14,
                                        height: 14,
                                        background: "#fff",
                                        border: "2px solid #3b6cf6",
                                        borderRadius: "50%",
                                        cursor: "nwse-resize",
                                    }}
                                />
                                {/* Resize handle right edge (font size only) */}
                                <div
                                    onMouseDown={(e) =>
                                        handleSubMouseDown(e, showIndex, "resize-font")
                                    }
                                    title="Kéo để chỉnh cỡ chữ"
                                    style={{
                                        position: "absolute",
                                        right: -6,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: 12,
                                        height: 12,
                                        background: "#3b6cf6",
                                        border: "2px solid #fff",
                                        borderRadius: 3,
                                        cursor: "ew-resize",
                                    }}
                                />
                            </div>
                        )}

                    {/* ===== Text Boxes (tự do) ===== */}
                    {!finalUrl && contentRect && textBoxes.map((tb) => {
                        const tbLeft = contentRect.left + tb.x * contentRect.width;
                        const tbTop = contentRect.top + tb.y * contentRect.height;
                        const tbW = (tb.width ?? 0.25) * contentRect.width;
                        const tbH = (tb.height ?? 0.08) * contentRect.height;
                        const isSelected = selectedTextBoxId === tb.id;
                        const isEditing = editingTextBoxId === tb.id;

                        return (
                            <div
                                key={tb.id}
                                onMouseDown={(e) => handleTextBoxMouseDown(e, tb.id, "move")}
                                onDoubleClick={(e) => handleTextBoxDoubleClick(e, tb.id)}
                                title="Kéo để di chuyển · Double-click để sửa chữ"
                                style={{
                                    position: "absolute",
                                    left: tbLeft,
                                    top: tbTop,
                                    width: tbW,
                                    height: tbH,
                                    transform: "translate(-50%, -50%)",
                                    cursor: dragging?.id === tb.id && dragging?.mode === "move" ? "grabbing" : "grab",
                                    border: isSelected ? "2px dashed #f59e0b" : "2px dashed rgba(245,158,11,0.5)",
                                    borderRadius: 4,
                                    background: (() => {
                                        if (tb.showBg === false) return "transparent";
                                        const hex = tb.bgColor || "#000000";
                                        const op = tb.bgOpacity ?? 0.7;
                                        const r = parseInt(hex.slice(1, 3), 16);
                                        const g = parseInt(hex.slice(3, 5), 16);
                                        const b = parseInt(hex.slice(5, 7), 16);
                                        return `rgba(${r},${g},${b},${op})`;
                                    })(),
                                    zIndex: 12,
                                    boxSizing: "border-box",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden",
                                }}
                            >
                                {isEditing ? (
                                    <textarea
                                        ref={editInputRef}
                                        value={tb.text}
                                        onChange={(e) =>
                                            setTextBoxes?.((prev) =>
                                                prev.map((t) => t.id === tb.id ? { ...t, text: e.target.value } : t)
                                            )
                                        }
                                        onBlur={commitTextEdit}
                                        onKeyDown={(e) => {
                                            if (e.key === "Escape") commitTextEdit();
                                            e.stopPropagation();
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            background: "transparent",
                                            border: "none",
                                            outline: "none",
                                            color: tb.color || "#ffffff",
                                            fontSize: `${tb.fontSize || 18}px`,
                                            fontFamily: tb.fontFamily || "Arial",
                                            fontWeight: 700,
                                            textAlign: "center",
                                            resize: "none",
                                            cursor: "text",
                                            padding: "4px 6px",
                                            boxSizing: "border-box",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        style={{
                                            color: tb.color || "#ffffff",
                                            fontSize: `${tb.fontSize || 18}px`,
                                            fontFamily: tb.fontFamily || "Arial",
                                            fontWeight: 700,
                                            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                                            pointerEvents: "none",
                                            userSelect: "none",
                                            padding: "4px 6px",
                                            wordBreak: "break-word",
                                            textAlign: "center",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {tb.text || "Text box"}
                                    </span>
                                )}

                                {/* Resize handle - bottom right */}
                                {isSelected && !isEditing && (
                                    <div
                                        onMouseDown={(e) => handleTextBoxMouseDown(e, tb.id, "resize")}
                                        title="Kéo để thay đổi kích thước"
                                        style={{
                                            position: "absolute",
                                            right: -7,
                                            bottom: -7,
                                            width: 14,
                                            height: 14,
                                            background: "#f59e0b",
                                            border: "2px solid #fff",
                                            borderRadius: "50%",
                                            cursor: "nwse-resize",
                                            zIndex: 13,
                                        }}
                                    />
                                )}

                                {/* Delete button */}
                                {isSelected && !isEditing && (
                                    <div
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            setTextBoxes?.((prev) => prev.filter((t) => t.id !== tb.id));
                                            setSelectedTextBoxId(null);
                                        }}
                                        title="Xóa text box"
                                        style={{
                                            position: "absolute",
                                            right: -7,
                                            top: -7,
                                            width: 16,
                                            height: 16,
                                            background: "#ef4444",
                                            border: "2px solid #fff",
                                            borderRadius: "50%",
                                            cursor: "pointer",
                                            zIndex: 13,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 10,
                                            color: "#fff",
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}
                                    >
                                        ×
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Hint khi chưa có subtitle */}
                    {!finalUrl && cfg?.enabled && subtitles.length === 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: 12,
                                left: 12,
                                background: bgRgba,
                                color: cfg.textColor,
                                padding: "8px 14px",
                                borderRadius: cfg.borderRadius,
                                fontWeight: 700,
                                fontSize: Math.min(cfg.fontSize ?? 16, 22),
                                fontFamily: cfg.fontFamily,
                                letterSpacing: 0.2,
                            }}
                        >
                            Sample subtitle text
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="preview-empty"
                    style={{ aspectRatio, position: "relative" }}
                    onClick={() => fileRef.current?.click()}
                >
                    <div style={{ textAlign: "center", cursor: "pointer" }}>
                        <Upload size={28} style={{ marginBottom: 10 }} />
                        <div style={{ fontWeight: 600, color: "#dde2f0" }}>
                            Click để upload video
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                            Định dạng: MP4 / MOV / WebM
                        </div>
                    </div>
                </div>
            )}

            {jobStatus && (
                <div className="job-status">
                    <div style={{ marginBottom: 4 }}>
                        {jobStatus} {jobProgress ? `(${jobProgress}%)` : ""}
                    </div>
                    <div
                        style={{
                            height: 6,
                            borderRadius: 999,
                            background: "#e5e7eb",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${jobProgress || 0}%`,
                                height: "100%",
                                background: "var(--primary)",
                                transition: "width 0.3s",
                            }}
                        />
                    </div>
                </div>
            )}

            {finalUrl && (
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <a
                        href={finalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        download
                    >
                        <Download size={14} /> Tải video đã xuất
                    </a>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload size={14} /> Video mới
                    </button>
                </div>
            )}
        </div>
    );
}