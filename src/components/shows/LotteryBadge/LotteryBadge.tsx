import { isLotteryActive } from "@/constants/lottery";
import styles from "./LotteryBadge.module.css";

interface LotteryBadgeProps {
  text?: string;
}

export default function LotteryBadge({ text = "🎟️ הגרלה" }: LotteryBadgeProps) {
  if (!isLotteryActive()) return null;

  return <span className={styles.badge}>{text}</span>;
}
