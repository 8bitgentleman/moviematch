import React, { ReactNode } from "react";
import styles from "./NavIcon.module.css";

interface NavIconProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

export const NavIcon = ({
  icon,
  label,
  isActive = false,
  badge,
  onClick,
}: NavIconProps) => {
  const badgeDisplay = badge !== undefined
    ? badge > 99 ? "99+" : badge.toString()
    : null;

  return (
    <button
      className={`${styles.navIcon} ${isActive ? styles.active : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      type="button"
    >
      <div className={styles.iconContainer}>
        <span className={styles.icon}>{icon}</span>
        {badgeDisplay && (
          <span className={styles.badge} aria-label={`${badge} notifications`}>
            {badgeDisplay}
          </span>
        )}
      </div>
      <span className={styles.label}>{label}</span>
    </button>
  );
};
