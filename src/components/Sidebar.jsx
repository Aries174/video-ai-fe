import { Info, RefreshCcw, FileText } from "lucide-react";

export default function Sidebar() {
    return (
        <aside className="app-sidebar">
            <button className="side-btn" title="Thông tin">
                <Info size={18} />
            </button>
            <button className="side-btn" title="Làm mới">
                <RefreshCcw size={18} />
            </button>
            <button className="side-btn active" title="Dự án">
                <FileText size={18} />
            </button>
        </aside>
    );
}
