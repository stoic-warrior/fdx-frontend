import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
}

const styles = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};

const Button = ({ variant = "primary", icon, children, ...props }: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        styles[variant]
      } ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

export default Button;
