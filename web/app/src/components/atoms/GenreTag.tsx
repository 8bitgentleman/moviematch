import React from "react";
import styles from "./GenreTag.module.css";

interface GenreTagProps {
  label: string;
}

export const GenreTag = ({ label }: GenreTagProps) => {
  return (
    <span className={styles.genreTag}>
      {label}
    </span>
  );
};
