import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`ui-card ${className}`}>
      {children}
    </div>
  );
}

export default Card;