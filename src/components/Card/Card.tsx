import styles from "./Card.module.css";

interface CardProps {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}

export default function Card({
  as: Component = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Component className={`${styles.card} ${className}`} {...props}>
      {children}
    </Component>
  );
}
