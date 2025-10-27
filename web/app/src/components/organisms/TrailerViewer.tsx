import React, { useState, useRef, useEffect, useCallback } from "react";
import { CloseIcon } from "../icons/CloseIcon";
import { Spinner } from "../atoms/Spinner";
import styles from "./TrailerViewer.module.css";

interface TrailerViewerProps {
  trailerUrl: string;
  posterUrl?: string;
  onClose: () => void;
}

export const TrailerViewer = ({
  trailerUrl,
  posterUrl,
  onClose,
}: TrailerViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Pause video on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
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

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.container}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close trailer"
          type="button"
        >
          <CloseIcon />
        </button>

        <div className={styles.videoContainer}>
          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <Spinner />
              <p className={styles.loadingText}>Loading trailer...</p>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className={styles.errorState}>
              <p className={styles.errorText}>
                Unable to load trailer
              </p>
              <button
                className={styles.retryButton}
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {/* Play Button Overlay (shown before playing) */}
          {!isPlaying && !isLoading && !hasError && posterUrl && (
            <div className={styles.playOverlay} onClick={handlePlayClick}>
              <img
                src={posterUrl}
                alt="Video thumbnail"
                className={styles.thumbnail}
              />
              <button
                className={styles.playButton}
                onClick={handlePlayClick}
                aria-label="Play trailer"
                type="button"
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="32"
                    fill="rgba(255, 255, 255, 0.9)"
                  />
                  <path
                    d="M26 20L46 32L26 44V20Z"
                    fill="#000000"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Video Element */}
          {!hasError && (
            <video
              ref={videoRef}
              className={styles.video}
              controls
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              poster={posterUrl}
              preload="metadata"
            >
              <source src={trailerUrl} type="video/mp4" />
              <source src={trailerUrl} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    </div>
  );
};
