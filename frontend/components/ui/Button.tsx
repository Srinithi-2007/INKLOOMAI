import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "outline" | "soft" | "danger" | "lime" | "dark";

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-card hover:bg-accent",
  secondary: "bg-accent text-white hover:bg-deep",
  outline: "border border-[#e4dcf5] bg-white text-accent shadow-soft hover:bg-lavender/40",
  soft: "bg-lavender text-accent hover:bg-mist",
  danger: "bg-white text-[#b42318] border border-[#f4c7c3] hover:bg-[#fef3f2]",
  lime: "bg-lime text-ink hover:bg-[#84cc16]",
  dark: "bg-ink text-white hover:bg-[#110c22]",
};

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  showArrow?: boolean;
  fullWidth?: boolean;
  className?: string;
  loading?: boolean;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  children,
  showArrow = false,
  fullWidth = true,
  className = "",
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : "w-auto"} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="inline-block animate-spin" aria-hidden="true">
          <Icon name="refresh" size={14} />
        </span>
      )}
      {children}
      {!loading && showArrow && <Icon name="arrow-right" size={14} />}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  href: string;
  onClick?: () => void;
};

export function LinkButton({
  href,
  variant = "primary",
  children,
  showArrow = false,
  fullWidth = true,
  className = "",
  onClick,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : "w-auto"} ${className}`}
    >
      {children}
      {showArrow && <Icon name="arrow-right" size={14} />}
    </Link>
  );
}

export function ActionLink({
  href,
  variant = "dark",
  children,
  icon,
  className = "",
}: {
  href: string;
  variant?: "primary" | "secondary" | "outline" | "soft" | "danger" | "lime" | "dark";
  children: ReactNode;
  icon?: IconName;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </Link>
  );
}