import React, { useState, useCallback, useMemo } from "react";
import type { Media, Match } from "../../../../../types/moviematch";
import { NavigationBar } from "../molecules/NavigationBar";
import { MovieDetails } from "../organisms/MovieDetails";
import { SegmentedControls, SegmentedControlOption } from "../atoms/SegmentedControls";
import styles from "./MatchesScreen.module.css";

type TabType = "swipe" | "browse" | "matches" | "settings";
type SortOption = "recent" | "alphabetical" | "rating";

interface MatchesScreenProps {
  matches: Match[];
  onTabChange: (tab: TabType) => void;
}

const formatMatchTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

export const MatchesScreen = ({ matches, onTabChange }: MatchesScreenProps) => {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  // Sort matches based on selected option
  const sortedMatches = useMemo(() => {
    const sorted = [...matches];

    switch (sortOption) {
      case "recent":
        return sorted.sort((a, b) => b.matchedAt - a.matchedAt);
      case "alphabetical":
        return sorted.sort((a, b) => a.media.title.localeCompare(b.media.title));
      case "rating":
        return sorted.sort((a, b) => b.media.rating - a.media.rating);
      default:
        return sorted;
    }
  }, [matches, sortOption]);

  const handleCardClick = useCallback((media: Media) => {
    setSelectedMedia(media);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  const isEmpty = matches.length === 0;

  return (
    <div className={styles.matchesScreen}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Matches</h1>
        <p className={styles.subtitle}>
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </p>
      </div>

      {/* Sort controls */}
      {!isEmpty && (
        <div className={styles.sortContainer}>
          <SegmentedControls
            name="matchSort"
            value={sortOption}
            onChange={(value) => setSortOption(value as SortOption)}
          >
            <SegmentedControlOption value="recent">
              Recent
            </SegmentedControlOption>
            <SegmentedControlOption value="alphabetical">
              A-Z
            </SegmentedControlOption>
            <SegmentedControlOption value="rating">
              Rating
            </SegmentedControlOption>
          </SegmentedControls>
        </div>
      )}

      {/* Content area */}
      <div className={styles.content}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>★</div>
            <h2 className={styles.emptyTitle}>No matches yet</h2>
            <p className={styles.emptyMessage}>
              Start swiping to find movies you both love!
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {sortedMatches.map((match) => (
              <div
                key={match.media.id}
                className={styles.matchCard}
                onClick={() => handleCardClick(match.media)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(match.media);
                  }
                }}
              >
                {/* Poster */}
                <div className={styles.posterContainer}>
                  {match.media.posterUrl ? (
                    <img
                      src={match.media.posterUrl}
                      alt={`${match.media.title} poster`}
                      className={styles.poster}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.posterPlaceholder}>
                      <span className={styles.placeholderText}>
                        {match.media.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className={styles.gradient} />

                  {/* Title overlay */}
                  <div className={styles.titleOverlay}>
                    <h3 className={styles.movieTitle}>{match.media.title}</h3>
                  </div>
                </div>

                {/* Match metadata */}
                <div className={styles.metadata}>
                  <p className={styles.matchTime}>
                    {formatMatchTime(match.matchedAt)}
                  </p>
                  <p className={styles.likedBy}>
                    Liked by {match.users.join(" & ")}
                  </p>
                  {match.media.rating > 0 && (
                    <p className={styles.rating}>
                      ★ {match.media.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <NavigationBar
        activeTab="matches"
        matchCount={matches.length}
        onTabChange={onTabChange}
      />

      {/* Movie details modal */}
      {selectedMedia && (
        <MovieDetails media={selectedMedia} onClose={handleCloseDetails} />
      )}
    </div>
  );
};
