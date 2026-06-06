import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import PreviewArea from "./components/PreviewArea";
import VideoAdjustPanel from "./components/VideoAdjustPanel";
import SubtitlePanel from "./components/SubtitlePanel";
import ExportPanel from "./components/ExportPanel";
import {
  fetchVoices,
  previewVoice,
  uploadVideo,
  uploadImage,
  getJobStatus,
  renderFinal,
  downloadUrl,
  apiBaseUrl,
} from "./api";

const DEFAULT_SUBTITLE_CONFIG = {
  enabled: true,
  textColor: "#FFFFFF",
  bgColor: "#000000",
  showBg: true,
  bgOpacity: 1,
  fontSize: 21,
  boxWidth: 300,
  boxHeight: 50,
  borderRadius: 4,
  fontFamily: "Arial",
};

const DEFAULT_VOICES = [
  { value: "vi-VN-HoaiMyNeural", label: "HN - Hoài My (Nữ)", lang: "vi" },
  { value: "vi-VN-NamMinhNeural", label: "HN - Nam Minh (Nam)", lang: "vi" },
];
const POLL_INTERVAL_MS = 2000;

export default function App() {
  // --- Files ---
  const [videoFile, setVideoFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [musicFile, setMusicFile] = useState(null);

  // Logo overlay (sau khi upload lên backend) — vị trí trên video
  // shape: { filename, url, x, y, width, height } - tỉ lệ 0..1
  const [logoMeta, setLogoMeta] = useState(null);

  // --- Aspect / Adjust ---
  const [aspectRatio, setAspectRatio] = useState("9 / 16");
  const [keepOriginalAudio, setKeepOriginalAudio] = useState(true);
  const [audioMode, setAudioMode] = useState("all");
  const [originalVolume, setOriginalVolume] = useState(0.1);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [zoomCrop, setZoomCrop] = useState(1.0);

  // --- Subtitle config (style chung) ---
  const [subtitleConfig, setSubtitleConfig] = useState(DEFAULT_SUBTITLE_CONFIG);

  // --- Subtitle list (do backend trả về sau /upload-video) ---
  const [subtitles, setSubtitles] = useState([]);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [textBoxes, setTextBoxes] = useState([]);

  // --- Language / Voice ---
  const [language, setLanguage] = useState("vi");
  const [voice, setVoice] = useState(DEFAULT_VOICES[0].value);
  const [voiceOptions, setVoiceOptions] = useState(DEFAULT_VOICES);
  const [previewing, setPreviewing] = useState(false);

  // --- Job / video preview ---
  const [videoUrl, setVideoUrl] = useState(""); // video sau bước 1 (đã có audio mới)
  const [videoFilename, setVideoFilename] = useState(""); // tên file backend trả về
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState(null);
  const [, setCurrentTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // bước 1: dịch + TTS
  const [isBurning, setIsBurning] = useState(false); // bước 2: burn-in subtitle
  const [finalUrl, setFinalUrl] = useState(""); // video cuối cùng

  const videoRef = useRef(null);
  const previewAudioRef = useRef(null);
  const setAllSubtitlesPosition = (x, y) => {
    setSubtitles(prev => prev.map(s => ({ ...s, x, y })));
  };
  // ===== Cleanup local blob =====
  useEffect(() => {
    return () => {
      if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // ===== Load voices when language changes =====
  useEffect(() => {
    let alive = true;
    fetchVoices(language)
      .then((data) => {
        if (!alive) return;
        const list = data?.voices?.length ? data.voices : DEFAULT_VOICES;
        setVoiceOptions(list);
        if (!list.some((v) => v.value === voice)) {
          setVoice(data?.defaultVoice || list[0]?.value || "");
        }
      })
      .catch(() => {
        if (!alive) return;
        const fallback = DEFAULT_VOICES.filter((v) => v.lang === language);
        setVoiceOptions(fallback.length ? fallback : DEFAULT_VOICES);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // ===== Poll job (bước 1) =====
  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    let timer;

    const tick = async () => {
      try {
        const data = await getJobStatus(jobId);
        if (!alive) return;
        setJob(data);

        if (data.progress === 100 && data.result?.video) {
          const filename = data.result.video;
          // Đổi sang video backend (có audio mới) để FE edit subtitle
          if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
          setVideoFilename(filename);
          setVideoUrl(downloadUrl(filename));
          setSubtitles(data.result.subtitles || []);
          setSelectedSubIndex(0);
          setIsProcessing(false);
          return;
        }

        if (data.status?.startsWith("Failed")) {
          setIsProcessing(false);
          alert(`Xử lý thất bại: ${data.status}`);
          return;
        }
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    };

    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // ===== Handlers =====
  const handlePickVideo = (file) => {
    if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setVideoFilename("");
    setSubtitles([]);
    setSelectedSubIndex(0);
    setFinalUrl("");
    setJob(null);
    setJobId("");
  };

  // Upload logo lên backend ngay khi user chọn file → lưu meta để preview drag/resize
  const handleLogoFileChange = async (file) => {
    setLogoFile(file);
    if (!file) {
      setLogoMeta(null);
      return;
    }
    try {
      const data = await uploadImage(file);
      if (data?.filename) {
        setLogoMeta({
          filename: data.filename,
          url: `${apiBaseUrl}${data.url}`,
          x: 0.85,
          y: 0.1,
          width: 0.12,
          height: 0.12,
        });
      }
    } catch (err) {
      console.error("Upload logo failed:", err);
      alert("Upload logo thất bại. Kiểm tra backend.");
    }
  };

  const handleAddTextBox = () => {
    setTextBoxes((p) => [
      ...p,
      {
        id: Date.now(),
        text: "Text box mới",
        x: 0.5,
        y: 0.3,
        fontSize: 18,
        color: "#ffffff",
        fontFamily: "Arial",
        bgColor: "#000000",
        bgOpacity: 0.7,
        showBg: true,
        width: 0.25,
        height: 0.08,
      },
    ]);
  };

  const handlePreviewVoice = async () => {
    if (previewing) return;
    setPreviewing(true);
    try {
      const blob = await previewVoice({ voice });
      const url = URL.createObjectURL(blob);

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = "";
      }
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.error(err);
      alert(`Không phát thử được giọng: ${err.message || err}`);
    } finally {
      setPreviewing(false);
    }
  };

  // ===== Bước 1: upload + transcribe + dịch + TTS (KHÔNG burn-in subtitle) =====
  const handleExport = async () => {
    if (!videoFile) {
      alert("Vui lòng chọn video trước khi xuất.");
      return;
    }
    setIsProcessing(true);
    setFinalUrl("");
    setVideoFilename("");
    setSubtitles([]);
    setJob({ progress: 1, status: "Đang gửi video lên server..." });

    try {
      const data = await uploadVideo({
        file: videoFile,
        voice,
        rate: "+0%",
        language,
        aspectRatio,
        keepOriginalAudio,
        audioMode,
        originalVolume,
        zoomCrop,
        subtitleConfig,
        textBoxes,
        logo: logoFile,
        music: musicFile,
      });
      if (!data?.job_id) throw new Error("Server không trả job_id");
      setJobId(data.job_id);
    } catch (err) {
      console.error(err);
      alert(`Không kết nối được backend: ${err.message || err}`);
      setIsProcessing(false);
      setJob(null);
    }
  };

  const handleBurnSubtitles = async () => {
    if (!videoFilename || subtitles.length === 0) {
      return alert("Chưa có video hoặc subtitle.");
    }
    setIsBurning(true);
    try {
      // Tính kích thước pixel thật của vùng video trong wrapper preview
      const wrapper = document.querySelector(".video-preview-wrapper");
      const video = videoRef.current;
      let pw = 0, ph = 0;

      if (wrapper && video?.videoWidth && video?.videoHeight) {
        const r = wrapper.getBoundingClientRect();
        const vRatio = video.videoWidth / video.videoHeight;
        const wRatio = r.width / r.height;
        if (wRatio > vRatio) {
          ph = r.height;
          pw = ph * vRatio;
        } else {
          pw = r.width;
          ph = pw / vRatio;
        }
      }

      console.log("[BurnSubtitles] preview dims:", {
        pw, ph,
        video: { w: video?.videoWidth, h: video?.videoHeight },
      });

      if (!pw || !ph) {
        alert("Không lấy được kích thước preview. Hãy đợi video load xong rồi thử lại.");
        setIsBurning(false);
        return;
      }

      const data = await renderFinal({
        video: videoFilename,
        subtitles,
        subtitleConfig,
        textBoxes,
        images: logoMeta ? [logoMeta] : [],
        previewWidth: Math.round(pw),
        previewHeight: Math.round(ph),
      });

      if (data?.filename) {
        setFinalUrl(downloadUrl(data.filename));
      } else {
        alert("Backend không trả filename");
      }
    } catch (err) {
      console.error(err);
      alert(`Render subtitle lỗi: ${err.message || err}`);
    } finally {
      setIsBurning(false);
    }
  };



  const handleSaveTemplate = () => {
    const template = {
      aspectRatio,
      keepOriginalAudio,
      audioMode,
      originalVolume,
      zoomCrop,
      subtitleConfig,
      language,
      voice,
    };
    localStorage.setItem("video-ai-template", JSON.stringify(template));
    alert("Đã lưu template vào trình duyệt.");
  };

  const handleApplyTemplate = () => {
    const raw = localStorage.getItem("video-ai-template");
    if (!raw) return alert("Chưa có template nào được lưu.");
    try {
      const t = JSON.parse(raw);
      setAspectRatio(t.aspectRatio ?? aspectRatio);
      setKeepOriginalAudio(t.keepOriginalAudio ?? true);
      setAudioMode(t.audioMode ?? "all");
      setOriginalVolume(t.originalVolume ?? 0.1);
      setZoomCrop(t.zoomCrop ?? 1.0);
      setSubtitleConfig(t.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG);
      setLanguage(t.language ?? "vi");
      setVoice(t.voice ?? voice);
      alert("Đã áp dụng template.");
    } catch {
      alert("Template lỗi, không áp dụng được.");
    }
  };

  const handleReset = () => {
    if (!confirm("Đặt lại toàn bộ chỉnh sửa?")) return;
    if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl("");
    setVideoFilename("");
    setLogoFile(null);
    setLogoMeta(null);
    setMusicFile(null);
    setAspectRatio("9 / 16");
    setKeepOriginalAudio(true);
    setAudioMode("all");
    setOriginalVolume(0.1);
    setRemoveWatermark(false);
    setZoomCrop(1.0);
    setSubtitleConfig(DEFAULT_SUBTITLE_CONFIG);
    setSubtitles([]);
    setSelectedSubIndex(0);
    setTextBoxes([]);
    setLanguage("vi");
    setFinalUrl("");
    setJob(null);
    setJobId("");
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <h1 className="page-title">
          <span className="badge-dot" />
          New Video Project
        </h1>

        <div className="editor-grid">
          {/* Left column - Preview */}
          <PreviewArea
            videoUrl={videoUrl}
            videoRef={videoRef}
            aspectRatio={aspectRatio}
            onMetadata={() => { }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            subtitleConfig={subtitleConfig}
            setSubtitleConfig={setSubtitleConfig}
            subtitles={subtitles}
            setSubtitles={setSubtitles}
            selectedSubIndex={selectedSubIndex}
            setSelectedSubIndex={setSelectedSubIndex}
            logoMeta={logoMeta}
            setLogoMeta={setLogoMeta}
            onPickVideo={handlePickVideo}
            jobStatus={job?.status}
            jobProgress={job?.progress}
            finalUrl={finalUrl}
            setAllSubtitlesPosition={setAllSubtitlesPosition}
            textBoxes={textBoxes}
            setTextBoxes={setTextBoxes}
          />

          {/* Right column - Controls */}
          <div>
            <VideoAdjustPanel
              logoFile={logoFile}
              setLogoFile={handleLogoFileChange}
              musicFile={musicFile}
              setMusicFile={setMusicFile}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              keepOriginalAudio={keepOriginalAudio}
              setKeepOriginalAudio={setKeepOriginalAudio}
              audioMode={audioMode}
              setAudioMode={setAudioMode}
              originalVolume={originalVolume}
              setOriginalVolume={setOriginalVolume}
              removeWatermark={removeWatermark}
              setRemoveWatermark={setRemoveWatermark}
              zoomCrop={zoomCrop}
              setZoomCrop={setZoomCrop}
            />

            <SubtitlePanel
              subtitleConfig={subtitleConfig}
              setSubtitleConfig={setSubtitleConfig}
              textBoxes={textBoxes}
              onAddTextBox={handleAddTextBox}
              setTextBoxes={setTextBoxes}
            />

            <ExportPanel
              language={language}
              setLanguage={setLanguage}
              voice={voice}
              setVoice={setVoice}
              voiceOptions={voiceOptions}
              onPreviewVoice={handlePreviewVoice}
              previewing={previewing}
              onExport={handleExport}
              isProcessing={isProcessing}
              hasSubtitles={subtitles.length > 0}
              onBurnSubtitles={handleBurnSubtitles}
              isBurning={isBurning}
              finalUrl={finalUrl}
              onSaveTemplate={handleSaveTemplate}
              onApplyTemplate={handleApplyTemplate}
              onReset={handleReset}
            />
          </div>
        </div>
      </main>
    </div>
  );
}