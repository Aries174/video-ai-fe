// Tập trung tất cả lời gọi backend ở 1 nơi để dễ chỉnh.
export const API_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export const downloadUrl = (filename) =>
    `${API_URL}/download/${encodeURIComponent(filename)}`;

export async function fetchVoices(language) {
    const qs = language ? `?language=${encodeURIComponent(language)}` : "";
    const res = await fetch(`${API_URL}/voices${qs}`);
    if (!res.ok) throw new Error("fetchVoices failed");
    return res.json();
}

export async function previewVoice({ voice, rate = "+0%", text } = {}) {
    const fd = new FormData();
    fd.append("voice", voice);
    fd.append("rate", rate);
    if (text) fd.append("text", text);

    const res = await fetch(`${API_URL}/preview-voice`, {
        method: "POST",
        body: fd,
    });
    if (!res.ok) {
        let msg = "preview-voice failed";
        try {
            const data = await res.json();
            if (data?.detail) msg = data.detail;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return res.blob();
}

export async function uploadVideo({
    file,
    videoUrl,
    voice,
    rate = "+0%",
    language,
    aspectRatio,
    keepOriginalAudio,
    audioMode,
    originalVolume,
    zoomCrop,
    subtitleConfig,
    textBoxes,
    logo,
    music,
    removeWatermark,
} = {}) {
    const fd = new FormData();
    if (videoUrl) {
        fd.append("videoUrl", videoUrl);
    } else if (file) {
        fd.append("file", file);
    }
    fd.append("voice", voice);
    fd.append("rate", rate);
    fd.append("language", language);
    fd.append("aspectRatio", aspectRatio);
    fd.append("keepOriginalAudio", String(!!keepOriginalAudio));
    fd.append("audioMode", audioMode);
    fd.append("originalVolume", String(originalVolume));
    fd.append("zoomCrop", String(zoomCrop));
    fd.append("subtitleConfig", JSON.stringify(subtitleConfig ?? {}));
    fd.append("textBoxes", JSON.stringify(textBoxes ?? []));
    fd.append("removeWatermark", String(!!removeWatermark));
    if (logo) fd.append("logo", logo);
    if (music) fd.append("music", music);

    const res = await fetch(`${API_URL}/upload-video`, {
        method: "POST",
        body: fd,
    });
    if (!res.ok) throw new Error("upload-video failed");
    return res.json();
}

export async function getJobStatus(jobId) {
    const res = await fetch(`${API_URL}/job-status/${jobId}`);
    if (!res.ok) throw new Error("job-status failed");
    return res.json();
}

export async function deleteJob(jobId) {
    try {
        await fetch(`${API_URL}/job/${jobId}`, { method: "DELETE" });
    } catch {
        /* ignore cleanup errors */
    }
}

export async function renderFinal({
    video,
    subtitles,
    subtitleConfig,
    images = [],
    previewWidth,
    previewHeight,
    textBoxes = [],
}) {
    const res = await fetch(`${API_URL}/render-final`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            video,
            subtitles,
            subtitleConfig,
            textBoxes,
            images,
            previewWidth,
            previewHeight,
        }),
    });
    if (!res.ok) {
        let msg = "render-final failed";
        try {
            const data = await res.json();
            if (data?.detail) msg = data.detail;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return res.json();
}

export const apiBaseUrl = API_URL;

export async function uploadImage(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/upload-image`, {
        method: "POST",
        body: fd,
    });
    if (!res.ok) throw new Error("upload-image failed");
    return res.json();
}
