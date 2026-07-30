// Numeric field that keeps local text state and commits on change.
export default function NumField({ label, value, onCommit, onFocus, placeholder = "—", accent, className = "", step = "any", inputMode = "decimal" }) {
  return (
    <div className={`numfield ${accent ? "accent" : ""} ${className}`}>
      {label && <label>{label}</label>}
      <input
        type="number"
        inputMode={inputMode}
        step={step}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onCommit(e.target.value)}
        onFocus={(e) => { e.target.select(); onFocus?.(e); }}
      />
    </div>
  );
}
