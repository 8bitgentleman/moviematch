import React, { useState, useCallback } from "react";
import { Button } from "../../atoms/Button";
import { ButtonContainer } from "../../layout/ButtonContainer";
import { Select } from "../../atoms/Select";
import { SegmentedControls, SegmentedControlOption } from "../../atoms/SegmentedControls";
import type { WizardState } from "./CreateRoomWizard";

import styles from "./FilterConfiguration.module.css";

interface FilterConfigurationProps {
  genres: string[];
  genreMode: "and" | "or";
  ratingMin?: number;
  ratingMax?: number;
  contentRatings: string[];
  watchedStatus: "all" | "unwatched" | "watched";
  sortOrder: "newest" | "oldest" | "random";
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const AVAILABLE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Western",
];

const CONTENT_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];

export const FilterConfiguration: React.FC<FilterConfigurationProps> = ({
  genres,
  genreMode,
  ratingMin,
  ratingMax,
  contentRatings,
  watchedStatus,
  sortOrder,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [localGenres, setLocalGenres] = useState<Set<string>>(
    new Set(genres)
  );
  const [localGenreMode, setLocalGenreMode] = useState<"and" | "or">(
    genreMode
  );
  const [localRatingMin, setLocalRatingMin] = useState<number>(
    ratingMin ?? 0
  );
  const [localRatingMax, setLocalRatingMax] = useState<number>(
    ratingMax ?? 10
  );
  const [localContentRatings, setLocalContentRatings] = useState<Set<string>>(
    new Set(contentRatings)
  );
  const [localWatchedStatus, setLocalWatchedStatus] = useState<
    "all" | "unwatched" | "watched"
  >(watchedStatus);
  const [localSortOrder, setLocalSortOrder] = useState<
    "newest" | "oldest" | "random"
  >(sortOrder);

  const toggleGenre = useCallback((genre: string) => {
    setLocalGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) {
        next.delete(genre);
      } else {
        next.add(genre);
      }
      return next;
    });
  }, []);

  const toggleContentRating = useCallback((rating: string) => {
    setLocalContentRatings((prev) => {
      const next = new Set(prev);
      if (next.has(rating)) {
        next.delete(rating);
      } else {
        next.add(rating);
      }
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    onUpdate({
      genres: Array.from(localGenres),
      genreMode: localGenreMode,
      ratingMin: localRatingMin,
      ratingMax: localRatingMax,
      contentRatings: Array.from(localContentRatings),
      watchedStatus: localWatchedStatus,
      sortOrder: localSortOrder,
    });
    onNext();
  }, [
    localGenres,
    localGenreMode,
    localRatingMin,
    localRatingMax,
    localContentRatings,
    localWatchedStatus,
    localSortOrder,
    onUpdate,
    onNext,
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configure Filters</h1>
        <p className={styles.description}>
          Customize your movie selection preferences
        </p>
      </div>

      <div className={styles.form}>
        {/* Genre Selection */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Genres</h3>
            <SegmentedControls
              name="genreMode"
              value={localGenreMode}
              onChange={(value) => setLocalGenreMode(value as "and" | "or")}
            >
              <SegmentedControlOption value="or">Any</SegmentedControlOption>
              <SegmentedControlOption value="and">All</SegmentedControlOption>
            </SegmentedControls>
          </div>
          <div className={styles.chipContainer}>
            {AVAILABLE_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                className={`${styles.chip} ${
                  localGenres.has(genre) ? styles.chipSelected : ""
                }`}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Filter */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Rating (0-10)</h3>
          <div className={styles.sliderContainer}>
            <div className={styles.sliderGroup}>
              <label htmlFor="rating-min" className={styles.sliderLabel}>
                Min: {localRatingMin}
              </label>
              <input
                id="rating-min"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={localRatingMin}
                onChange={(e) => setLocalRatingMin(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label htmlFor="rating-max" className={styles.sliderLabel}>
                Max: {localRatingMax}
              </label>
              <input
                id="rating-max"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={localRatingMax}
                onChange={(e) => setLocalRatingMax(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
        </div>

        {/* Content Rating */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Content Rating</h3>
          <div className={styles.checkboxGroup}>
            {CONTENT_RATINGS.map((rating) => (
              <label key={rating} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={localContentRatings.has(rating)}
                  onChange={() => toggleContentRating(rating)}
                  className={styles.checkbox}
                />
                <span>{rating}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Watched Status */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Watched Status</h3>
          <SegmentedControls
            name="watchedStatus"
            value={localWatchedStatus}
            onChange={(value) =>
              setLocalWatchedStatus(value as "all" | "unwatched" | "watched")}
          >
            <SegmentedControlOption value="all">All</SegmentedControlOption>
            <SegmentedControlOption value="unwatched">Unwatched</SegmentedControlOption>
            <SegmentedControlOption value="watched">Watched</SegmentedControlOption>
          </SegmentedControls>
        </div>

        {/* Sort Order */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Sort Order</h3>
          <Select
            name="sortOrder"
            value={localSortOrder}
            onChange={(e) =>
              setLocalSortOrder(
                e.target.value as "newest" | "oldest" | "random"
              )}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="random">Random</option>
          </Select>
        </div>
      </div>

      <ButtonContainer reverseMobile paddingTop="s3">
        <Button
          appearance="Tertiary"
          onPress={onBack}
          testHandle="filter-back"
        >
          Back
        </Button>
        <Button
          appearance="Primary"
          onPress={handleNext}
          testHandle="filter-next"
        >
          Next
        </Button>
      </ButtonContainer>
    </div>
  );
};
