"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export function Field({
  label,
  hint,
  icon,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  icon?: IconName;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">{label}</label>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9b96ab]">
            <Icon name={icon} size={14} />
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

export function TextInput({
  icon,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { icon?: boolean }) {
  return (
    <input
      className={`field-input ${icon ? "pl-9" : ""} ${className}`}
      {...rest}
    />
  );
}

export function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete = "new-password",
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9b96ab]">
        <Icon name="lock" size={14} />
      </span>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`field-input pl-9 pr-10 ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-lavender focus:outline-none"
      >
        <Icon name={visible ? "eye-off" : "eye"} size={16} />
      </button>
    </div>
  );
}

export function Checkbox({
  id,
  children,
  required,
  name,
  checked,
  onChange,
  className = "",
}: {
  id: string;
  children: ReactNode;
  required?: boolean;
  name?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 text-[13px] leading-5 text-muted ${className}`}>
      <input
        id={id}
        name={name}
        type="checkbox"
        required={required}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[#cfc6e6] accent-primary"
      />
      <span>{children}</span>
    </label>
  );
}