import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../../atoms/Button";
import { ButtonContainer } from "../../layout/ButtonContainer";
import { Spinner } from "../../atoms/Spinner";
import { useStore } from "../../../store";
import type { WizardState } from "./CreateRoomWizard";

import styles from "./LibrarySelection.module.css";

interface LibrarySelectionProps {
  selectedLibraries: string[];
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const LibrarySelection: React.FC<LibrarySelectionProps> = ({
  selectedLibraries,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [{ createRoom }, dispatch] = useStore(["createRoom"]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedLibraries)
  );

  useEffect(() => {
    // Fetch libraries from WebSocket when component mounts
    dispatch({ type: "getLibraries" });
  }, [dispatch]);

  const toggleLibrary = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (createRoom?.libraries) {
      setSelected(new Set(createRoom.libraries.map((lib) => lib.key)));
    }
  }, [createRoom?.libraries]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleNext = useCallback(() => {
    onUpdate({ selectedLibraries: Array.from(selected) });
    onNext();
  }, [selected, onUpdate, onNext]);

  const libraries = createRoom?.libraries ?? [];
  const loading = createRoom?.librariesLoading ?? true;
  const error = createRoom?.librariesError;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
        <p className={styles.loadingText}>Loading libraries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
        <Button appearance="Primary" onPress={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Select Libraries</h1>
        <p className={styles.description}>
          Choose which libraries to include in your room
        </p>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={selectAll}
          type="button"
        >
          Select All
        </button>
        <button
          className={styles.actionButton}
          onClick={deselectAll}
          type="button"
        >
          Deselect All
        </button>
      </div>

      <div className={styles.libraryList}>
        {libraries.map((lib) => (
          <label
            key={lib.key}
            className={`${styles.libraryItem} ${
              selected.has(lib.key) ? styles.libraryItemSelected : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(lib.key)}
              onChange={() => toggleLibrary(lib.key)}
              className={styles.checkbox}
              aria-label={`Select ${lib.title}`}
            />
            <div className={styles.libraryInfo}>
              <div className={styles.libraryTitle}>{lib.title}</div>
              <div className={styles.libraryMeta}>
                <span className={styles.libraryType}>
                  {lib.type === "movie"
                    ? "Movies"
                    : lib.type === "show"
                    ? "TV Shows"
                    : lib.type}
                </span>
              </div>
            </div>
            {selected.has(lib.key) && (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.checkIcon}
                aria-hidden="true"
              >
                <path
                  d="M16.5 5L7.5 14L3.5 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </label>
        ))}
      </div>

      {libraries.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            No libraries found. Please check your Plex server configuration.
          </p>
        </div>
      )}

      <ButtonContainer reverseMobile paddingTop="s3">
        <Button
          appearance="Tertiary"
          onPress={onBack}
          testHandle="library-back"
        >
          Back
        </Button>
        <Button
          appearance="Primary"
          onPress={handleNext}
          disabled={selected.size === 0}
          testHandle="library-next"
        >
          Next ({selected.size} selected)
        </Button>
      </ButtonContainer>
    </div>
  );
};
