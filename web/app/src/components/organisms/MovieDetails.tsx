import React, { useEffect, useCallback } from "react";
import type { Media } from "../../../../../types/moviematch";
import { CloseIcon } from "../icons/CloseIcon";
import styles from "./MovieDetails.module.css";

interface MovieDetailsProps {
  media: Media;
  onClose: () => void;
}

export const MovieDetails = ({ media, onClose }: MovieDetailsProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const formatLastViewed = (timestamp?: number) => {
    if (!timestamp) return null;

    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close details"
          type="button"
        >
          <CloseIcon />
        </button>

        <div className={styles.content}>
          {/* Poster Image */}
          {media.posterUrl && (
            <div className={styles.posterContainer}>
              <img
                src={media.posterUrl}
                alt={`${media.title} poster`}
                className={styles.poster}
              />
            </div>
          )}

          {/* Title and Year */}
          <div className={styles.header}>
            <h1 className={styles.title}>{media.title}</h1>
            {media.year && (
              <span className={styles.year}>{media.year}</span>
            )}
          </div>

          {/* Rating and Content Rating */}
          <div className={styles.metaRow}>
            {media.rating > 0 && (
              <div className={styles.rating}>
                <span className={styles.ratingValue}>
                  ★ {media.rating.toFixed(1)}
                </span>
              </div>
            )}
            {media.contentRating && (
              <span className={styles.contentRating}>{media.contentRating}</span>
            )}
          </div>

          {/* Tagline */}
          {media.tagline && (
            <div className={styles.section}>
              <p className={styles.tagline}>{media.tagline}</p>
            </div>
          )}

          {/* Description */}
          {media.description && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Synopsis</h2>
              <p className={styles.description}>{media.description}</p>
            </div>
          )}

          {/* Directors */}
          {media.directors && media.directors.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Director{media.directors.length > 1 ? "s" : ""}</h2>
              <p className={styles.sectionContent}>
                {media.directors.join(", ")}
              </p>
            </div>
          )}

          {/* Writers */}
          {media.writers && media.writers.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Writer{media.writers.length > 1 ? "s" : ""}</h2>
              <p className={styles.sectionContent}>
                {media.writers.join(", ")}
              </p>
            </div>
          )}

          {/* Actors */}
          {media.actors && media.actors.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Cast</h2>
              <p className={styles.sectionContent}>
                {media.actors.join(", ")}
              </p>
            </div>
          )}

          {/* Collections */}
          {media.collections && media.collections.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Collections</h2>
              <p className={styles.sectionContent}>
                {media.collections.join(", ")}
              </p>
            </div>
          )}

          {/* Genres */}
          {media.genres && media.genres.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Genres</h2>
              <p className={styles.sectionContent}>
                {media.genres.join(", ")}
              </p>
            </div>
          )}

          {/* Last Viewed */}
          {media.lastViewedAt && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Last Viewed</h2>
              <p className={styles.sectionContent}>
                {formatLastViewed(media.lastViewedAt)}
                {media.viewCount && media.viewCount > 1 && ` (${media.viewCount} times)`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
