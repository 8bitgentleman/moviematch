import React, { useState } from "react";
import { Button } from "../../atoms/Button";
import { ButtonContainer } from "../../layout/ButtonContainer";
import { Spinner } from "../../atoms/Spinner";
import type { WizardState } from "./CreateRoomWizard";

import styles from "./RoomReview.module.css";

interface RoomReviewProps {
  wizardState: WizardState;
  onEdit: (step: number) => void;
  onCreate: () => void;
  onBack: () => void;
}

export const RoomReview: React.FC<RoomReviewProps> = ({
  wizardState,
  onEdit,
  onCreate,
  onBack,
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    onCreate();
  };

  const getRoomTypeName = (type: string) => {
    const types: Record<string, string> = {
      standard: "Standard",
      unanimous: "Unanimous",
      solo: "Solo",
      async: "Async",
    };
    return types[type] || type;
  };

  const getSortOrderName = (order: string) => {
    const orders: Record<string, string> = {
      newest: "Newest First",
      oldest: "Oldest First",
      random: "Random",
    };
    return orders[order] || order;
  };

  const getWatchedStatusName = (status: string) => {
    const statuses: Record<string, string> = {
      all: "All",
      unwatched: "Unwatched Only",
      watched: "Watched Only",
    };
    return statuses[status] || status;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Review & Create</h1>
        <p className={styles.description}>
          Review your room settings before creating
        </p>
      </div>

      <div className={styles.reviewSections}>
        {/* Basic Info */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Basic Info</h3>
            <button
              className={styles.editButton}
              onClick={() => onEdit(1)}
              type="button"
            >
              Edit
            </button>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.item}>
              <span className={styles.label}>Room Name:</span>
              <span className={styles.value}>{wizardState.roomName}</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Password:</span>
              <span className={styles.value}>
                {wizardState.password ? "Protected" : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Libraries */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Libraries</h3>
            <button
              className={styles.editButton}
              onClick={() => onEdit(2)}
              type="button"
            >
              Edit
            </button>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.item}>
              <span className={styles.label}>Selected:</span>
              <span className={styles.value}>
                {wizardState.selectedLibraries.length > 0
                  ? `${wizardState.selectedLibraries.length} libraries`
                  : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Filters</h3>
            <button
              className={styles.editButton}
              onClick={() => onEdit(3)}
              type="button"
            >
              Edit
            </button>
          </div>
          <div className={styles.sectionContent}>
            {wizardState.genres.length > 0 && (
              <div className={styles.item}>
                <span className={styles.label}>Genres:</span>
                <div className={styles.chipList}>
                  {wizardState.genres.map((genre) => (
                    <span key={genre} className={styles.chip}>
                      {genre}
                    </span>
                  ))}
                  <span className={styles.modeChip}>
                    {wizardState.genreMode === "and" ? "All" : "Any"}
                  </span>
                </div>
              </div>
            )}
            {(wizardState.ratingMin !== undefined ||
              wizardState.ratingMax !== undefined) && (
              <div className={styles.item}>
                <span className={styles.label}>Rating:</span>
                <span className={styles.value}>
                  {wizardState.ratingMin ?? 0} - {wizardState.ratingMax ?? 10}
                </span>
              </div>
            )}
            {wizardState.contentRatings.length > 0 && (
              <div className={styles.item}>
                <span className={styles.label}>Content Rating:</span>
                <div className={styles.chipList}>
                  {wizardState.contentRatings.map((rating) => (
                    <span key={rating} className={styles.chip}>
                      {rating}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.item}>
              <span className={styles.label}>Watched Status:</span>
              <span className={styles.value}>
                {getWatchedStatusName(wizardState.watchedStatus)}
              </span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Sort Order:</span>
              <span className={styles.value}>
                {getSortOrderName(wizardState.sortOrder)}
              </span>
            </div>
          </div>
        </div>

        {/* Room Type */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Room Type</h3>
            <button
              className={styles.editButton}
              onClick={() => onEdit(4)}
              type="button"
            >
              Edit
            </button>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.item}>
              <span className={styles.label}>Type:</span>
              <span className={styles.value}>
                {getRoomTypeName(wizardState.roomType)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ButtonContainer reverseMobile paddingTop="s3">
        <Button
          appearance="Tertiary"
          onPress={onBack}
          disabled={isCreating}
          testHandle="review-back"
        >
          Back
        </Button>
        <Button
          appearance="Primary"
          onPress={handleCreate}
          disabled={isCreating}
          testHandle="review-create"
        >
          {isCreating ? (
            <span className={styles.creatingText}>
              <Spinner />
              Creating...
            </span>
          ) : (
            "Create Room"
          )}
        </Button>
      </ButtonContainer>
    </div>
  );
};
