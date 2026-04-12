export function Panel({ titulo, children, extraTopRight, className = "", bodyClassName = "", tone = "default" }) {
  const toneMap = {
    default: "border-slate-200/90 dark:border-slate-800 bg-white/92 dark:bg-slate-900 shadow-[0_12px_34px_rgba(15,23,42,0.05)]",
    subtle: "border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-[0_10px_28px_rgba(15,23,42,0.04)]",
    highlight: "border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)]",
  };

  const borderTone = tone === "highlight" ? "border-white/10" : "border-slate-200/80 dark:border-slate-800";
  const titleTone = tone === "highlight" ? "text-white" : "text-slate-900 dark:text-slate-100";

  return (
    <div className={`rounded-[24px] border p-4 backdrop-blur-sm sm:rounded-[28px] sm:p-7 ${toneMap[tone]} ${className}`}>
      <div className={`mb-5 flex flex-col gap-3 border-b pb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between ${borderTone}`}>
        <h2 className={`text-lg font-semibold tracking-[-0.02em] ${titleTone}`}>{titulo}</h2>
        {extraTopRight && <div className="w-full sm:w-auto">{extraTopRight}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export function TabButton({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
        activo
          ? "bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm"
          : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export function Campo({ label, value, onChange, type = "text", inputProps = {}, className = "", inputClassName = "", labelClassName = "" }) {
  return (
    <div className={className}>
      <label className={`mb-2 block text-[11px] font-semibold tracking-[0.12em] text-slate-500 ${labelClassName}`}>{label}</label>
      <input
        type={type}
        step={type === "number" ? (inputProps.step || "0.01") : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-800 dark:text-slate-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70 dark:focus:ring-slate-700/50 ${inputClassName}`}
        {...inputProps}
      />
    </div>
  );
}

export function SelectField({ label, value, onChange, options, className = "", selectClassName = "", labelClassName = "" }) {
  return (
    <div className={className}>
      <label className={`mb-2 block text-[11px] font-semibold tracking-[0.12em] text-slate-500 ${labelClassName}`}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-800 dark:text-slate-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] transition-all focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70 dark:focus:ring-slate-700/50 ${selectClassName}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold tracking-[0.12em] text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] transition-all resize-y focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70 dark:focus:ring-slate-700/50"
      />
    </div>
  );
}

export function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded text-slate-700 focus:ring-slate-400"
      />
      {label}
    </label>
  );
}

export function FilaResumen({ label, valor, fuerte = false }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl py-2 ${fuerte ? "bg-white/8 px-3" : ""}`}>
      <span className={fuerte ? "text-sm font-medium text-white/75" : "text-sm text-white/65"}>{label}</span>
      <span className={fuerte ? "text-[1.55rem] font-bold tracking-[-0.04em] text-white sm:text-[1.9rem]" : "text-sm font-semibold text-white"}>{valor}</span>
    </div>
  );
}

export function CajaResumen({ label, valor, color = "#f8fafc" }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 px-3 py-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]" style={{ backgroundColor: color }}>
      <div className="text-[10px] font-semibold tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold tracking-[-0.01em] text-slate-800">{valor}</div>
    </div>
  );
}

export function Vacio({ mensaje }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center text-sm text-slate-500">
      <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6 text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      {mensaje}
    </div>
  );
}

export function ButtonPrimary({ children, onClick, disabled, color, className = "", icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.14)] transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${className}`}
      style={{ backgroundColor: color || "#183153" }}
    >
      {icon}
      {children}
    </button>
  );
}

export function ButtonSecondary({ children, onClick, disabled, className = "", icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:hover:bg-slate-700 active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
