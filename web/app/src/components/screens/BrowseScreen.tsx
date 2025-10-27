import React, { useState, useMemo, useCallback } from "react";
import type { Media } from "../../../../../types/moviematch";
import { NavigationBar } from "../molecules/NavigationBar";
import { MovieDetails } from "../organisms/MovieDetails";
import { TextInput } from "../atoms/TextInput";
import { Select } from "../atoms/Select";
import styles from "./BrowseScreen.module.css";

type TabType = "swipe" | "browse" | "matches" | "settings";
type SortOption = "title" | "rating" | "year" | "recent";

interface BrowseScreenProps {
  media: Media[];
  onBookmark?: (media: Media) => void;
  isAuthenticated?: boolean;
  matchCount?: number;
  onTabChange: (tab: TabType) => void;
}

export const BrowseScreen = ({
  media,
  onBookmark,
  isAuthenticated = false,
  matchCount = 0,
  onTabChange,
}: BrowseScreenProps) => {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("title");
  const [minRating, setMinRating] = useState<number>(0);

  // Extract unique genres from media
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    media.forEach((item) => {
      item.genres?.forEach((genre) => genreSet.add(genre));
    });
    return ["all", ...Array.from(genreSet).sort()];
  }, [media]);

  // Filter and sort media
  const filteredMedia = useMemo(() => {
    let filtered = media;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.actors?.some((actor) => actor.toLowerCase().includes(query)) ||
          item.directors?.some((director) => director.toLowerCase().includes(query))
      );
    }

    // Genre filter
    if (selectedGenre !== "all") {
      filtered = filtered.filter((item) =>
        item.genres?.includes(selectedGenre)
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter((item) => item.rating >= minRating);
    }

    // Sort
    const sorted = [...filtered];
    switch (sortOption) {
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "year":
        sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "recent":
        sorted.sort((a, b) => (b.lastViewedAt || 0) - (a.lastViewedAt || 0));
        break;
    }

    return sorted;
  }, [media, searchQuery, selectedGenre, sortOption, minRating]);

  const handleCardClick = useCallback((media: Media) => {
    setSelectedMedia(media);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent, media: Media) => {
      e.stopPropagation();
      if (onBookmark) {
        onBookmark(media);
      }
    },
    [onBookmark]
  );

  const isEmpty = filteredMedia.length === 0;

  return (
    <div className={styles.browseScreen}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Browse</h1>
        <p className={styles.subtitle}>
          {filteredMedia.length} {filteredMedia.length === 1 ? "movie" : "movies"}
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        {/* Search */}
        <div className={styles.searchContainer}>
          <TextInput
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Search movies"
          />
        </div>

        {/* Filter controls */}
        <div className={styles.filterControls}>
          <Select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by genre"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === "all" ? "All Genres" : genre}
              </option>
            ))}
          </Select>

          <Select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className={styles.filterSelect}
            aria-label="Sort by"
          >
            <option value="title">A-Z</option>
            <option value="rating">Rating</option>
            <option value="year">Year</option>
            <option value="recent">Recently Viewed</option>
          </Select>

          <Select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className={styles.filterSelect}
            aria-label="Minimum rating"
          >
            <option value={0}>Any Rating</option>
            <option value={5}>5+ Stars</option>
            <option value={6}>6+ Stars</option>
            <option value={7}>7+ Stars</option>
            <option value={8}>8+ Stars</option>
            <option value={9}>9+ Stars</option>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2 className={styles.emptyTitle}>No movies found</h2>
            <p className={styles.emptyMessage}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className={styles.card}
                onClick={() => handleCardClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(item);
                  }
                }}
              >
                {/* Poster */}
                <div className={styles.posterContainer}>
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={`${item.title} poster`}
                      className={styles.poster}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.posterPlaceholder}>
                      <span className={styles.placeholderText}>
                        {item.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Bookmark button */}
                  {isAuthenticated && onBookmark && (
                    <button
                      className={styles.bookmarkButton}
                      onClick={(e) => handleBookmarkClick(e, item)}
                      aria-label="Add to watchlist"
                      type="button"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 2C4.44772 2 4 2.44772 4 3V18L10 14L16 18V3C16 2.44772 15.5523 2 15 2H5Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Gradient overlay */}
                  <div className={styles.gradient} />

                  {/* Title overlay */}
                  <div className={styles.titleOverlay}>
                    <h3 className={styles.movieTitle}>{item.title}</h3>
                    {item.year && (
                      <p className={styles.movieYear}>{item.year}</p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className={styles.metadata}>
                  {item.rating > 0 && (
                    <p className={styles.rating}>
                      ★ {item.rating.toFixed(1)}
                    </p>
                  )}
                  {item.genres && item.genres.length > 0 && (
                    <p className={styles.genres}>
                      {item.genres.slice(0, 2).join(", ")}
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
        activeTab="browse"
        matchCount={matchCount}
        onTabChange={onTabChange}
      />

      {/* Movie details modal */}
      {selectedMedia && (
        <MovieDetails media={selectedMedia} onClose={handleCloseDetails} />
      )}
    </div>
  );
};
