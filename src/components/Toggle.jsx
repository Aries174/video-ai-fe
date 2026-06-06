export default function Toggle({ checked, onChange, disabled = false }) {
    return (
        <label className="toggle">
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.checked)}
            />
            <span className="slider" />
        </label>
    );
}
