interface SquareCheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  "aria-label"?: string;
}

export function SquareCheckbox({
  checked = false,
  indeterminate = false,
  disabled = false,
  onChange,
  "aria-label": ariaLabel,
}: SquareCheckboxProps) {
  return (
    <span
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className="square-checkbox"
      data-checked={checked && !indeterminate ? "true" : "false"}
      data-indeterminate={indeterminate ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onChange) onChange(!checked);
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onChange?.(!checked);
        }
      }}
    />
  );
}

interface SquareCheckboxLabelProps extends SquareCheckboxProps {
  label: string;
  description?: string;
}

export function SquareCheckboxLabel({
  label,
  description,
  checked,
  indeterminate,
  disabled,
  onChange,
}: SquareCheckboxLabelProps) {
  return (
    <label
      className="square-checkbox-label"
      data-disabled={disabled ? "true" : "false"}
      onClick={(e) => e.stopPropagation()}
    >
      <SquareCheckbox
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
      />
      <span>
        <span style={{ fontWeight: 500 }}>{label}</span>
        {description ? (
          <span
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--panel-text-muted)",
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
