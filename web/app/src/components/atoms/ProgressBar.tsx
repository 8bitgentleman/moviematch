import React from "react";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  total: number;
  current: number;
}

export const ProgressBar = ({ total, current }: ProgressBarProps) => {
  return (
    <div
      className={styles.progressBar}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Progress: ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`${styles.segment} ${
            index === current ? styles.active : ""
          }`}
          aria-current={index === current ? "true" : undefined}
        />
      ))}
    </div>
  );
};
