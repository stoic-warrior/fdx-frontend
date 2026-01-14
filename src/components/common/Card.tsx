import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  accent?: string;
}

const Card = ({ children, accent = "border-blue-500" }: CardProps) => {
  return (
    <div className={`rounded-2xl border-l-4 ${accent} bg-white p-6 shadow-sm`}>{children}</div>
  );
};

export default Card;
