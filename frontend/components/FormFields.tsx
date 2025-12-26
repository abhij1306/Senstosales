/**
 * Shared Form Components
 * Used in DC and Invoice pages for consistent form styling
 */

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: "text" | "email" | "tel" | "date";
}

export const TextField = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  type = "text",
}: TextFieldProps) => {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white ${
          disabled ? "bg-gray-50 text-text-secondary cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
};

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const NumberField = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  required = false,
  disabled = false,
  placeholder = "",
}: NumberFieldProps) => {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white ${
          disabled ? "bg-gray-50 text-text-secondary cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
};

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  rows = 3,
}: TextAreaFieldProps) => {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white resize-none ${
          disabled ? "bg-gray-50 text-text-secondary cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
};

interface SelectFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  placeholder = "Select...",
}: SelectFieldProps) => {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white ${
          disabled ? "bg-gray-50 text-text-secondary cursor-not-allowed" : ""
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ReadOnlyFieldProps {
  label: string;
  value: string | number;
  isCurrency?: boolean;
}

export const ReadOnlyField = ({
  label,
  value,
  isCurrency = false,
}: ReadOnlyFieldProps) => {
  const displayValue =
    isCurrency && typeof value === "number"
      ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : value;

  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
        {label}
      </label>
      <div className="px-3 py-2 text-sm bg-gray-50 border border-border rounded-lg text-text-primary">
        {displayValue || "-"}
      </div>
    </div>
  );
};
