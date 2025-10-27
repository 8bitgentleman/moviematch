import React, { ReactNode } from "react";
import styles from "./ActionButton.module.css";

type ActionColor = "undo" | "reject" | "bookmark" | "like";
type ActionSize = "sm" | "md" | "lg";

interface ActionButtonProps {
  icon: ReactNode;
  color: ActionColor;
  size?: ActionSize;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
}

export const ActionButton = ({
  icon,
  color,
  size = "md",
  onClick,
  disabled = false,
  ariaLabel,
}: ActionButtonProps) => {
  return (
    <button
      className={`${styles.actionButton} ${styles[size]} ${styles[color]}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      type="button"
    >
      <span className={styles.icon}>{icon}</span>
    </button>
  );
};
