import React from "react";
import { GenreTag } from "../atoms/GenreTag";
import { InfoIcon } from "../icons/InfoIcon";
import styles from "./MovieInfo.module.css";

interface MovieInfoProps {
  title: string;
  duration: number; // in minutes
  genres: string[];
  onInfoClick?: () => void;
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};

export const MovieInfo = ({
  title,
  duration,
  genres,
  onInfoClick,
}: MovieInfoProps) => {
  return (
    <div className={styles.movieInfo}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          <span className={styles.duration}>{formatDuration(duration)}</span>
        </div>
        <button
          className={styles.infoButton}
          onClick={onInfoClick}
          aria-label="More information"
          type="button"
        >
          <InfoIcon size="20px" />
        </button>
      </div>

      {genres.length > 0 && (
        <div className={styles.genres}>
          {genres.map((genre) => (
            <GenreTag key={genre} label={genre} />
          ))}
        </div>
      )}
    </div>
  );
};
