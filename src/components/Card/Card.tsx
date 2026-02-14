import styles from "./Card.module.css";
import { cx } from "@/utils/cx";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

export default function Card({
  as: Component = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Component className={cx(styles.card, className)} {...props}>
      {children}
    </Component>
  );
}
