import { useRef } from "react";
import { Upload } from "lucide-react";

export default function UploadBox({
    label,
    accept,
    file,
    onFileSelected,
    hint,
}) {
    const inputRef = useRef(null);

    return (
        <div
            className={`upload-box ${file ? "has-file" : ""}`}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="file-hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFileSelected?.(f);
                }}
            />
            <Upload size={22} className="upload-icon" />
            <div>
                {file ? (
                    <strong style={{ wordBreak: "break-all" }}>{file.name}</strong>
                ) : (
                    label
                )}
            </div>
            {hint && !file && (
                <div style={{ marginTop: 4, fontSize: 11.5 }}>{hint}</div>
            )}
        </div>
    );
}
