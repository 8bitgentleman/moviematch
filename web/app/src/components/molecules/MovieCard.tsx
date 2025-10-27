import React, { useState } from "react";
import { Spinner } from "../atoms/Spinner";
import styles from "./MovieCard.module.css";

interface MovieCardProps {
  posterUrl: string;
  title: string;
  alt?: string;
}

export const MovieCard = ({ posterUrl, title, alt }: MovieCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const imageAlt = alt || `${title} poster`;

  return (
    <div className={styles.movieCard}>
      {isLoading && (
        <div className={styles.loadingState}>
          <Spinner />
        </div>
      )}

      {hasError && (
        <div className={styles.errorState}>
          <p className={styles.errorText}>Failed to load poster</p>
          <p className={styles.errorTitle}>{title}</p>
        </div>
      )}

      {!hasError && (
        <>
          <img
            src={posterUrl}
            alt={imageAlt}
            className={`${styles.poster} ${isLoading ? styles.posterLoading : ""}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          <div className={styles.gradient} />
        </>
      )}
    </div>
  );
};
