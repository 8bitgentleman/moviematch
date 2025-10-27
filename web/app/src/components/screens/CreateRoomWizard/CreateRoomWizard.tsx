import React, { useState, useCallback } from "react";
import { useStore } from "../../../store";
import { Layout } from "../../layout/Layout";
import { ErrorMessage } from "../../atoms/ErrorMessage";
import { RoomBasicInfo } from "./RoomBasicInfo";
import { LibrarySelection } from "./LibrarySelection";
import { FilterConfiguration } from "./FilterConfiguration";
import { RoomTypeSelection } from "./RoomTypeSelection";
import { RoomReview } from "./RoomReview";
import type { RoomType } from "../../../../../../types/moviematch";

import styles from "./CreateRoomWizard.module.css";

export interface WizardState {
  step: number;
  roomName: string;
  password?: string;
  selectedLibraries: string[];
  genres: string[];
  genreMode: "and" | "or";
  ratingMin?: number;
  ratingMax?: number;
  contentRatings: string[];
  watchedStatus: "all" | "unwatched" | "watched";
  sortOrder: "newest" | "oldest" | "random";
  roomType: RoomType;
}

const TOTAL_STEPS = 5;

export const CreateRoomWizard = () => {
  const [{ error }, dispatch] = useStore(["error"]);
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 1,
    roomName: "",
    password: undefined,
    selectedLibraries: [],
    genres: [],
    genreMode: "or",
    ratingMin: undefined,
    ratingMax: undefined,
    contentRatings: [],
    watchedStatus: "all",
    sortOrder: "random",
    roomType: "standard",
  });

  const updateState = useCallback(
    (updates: Partial<WizardState>) => {
      setWizardState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const goToStep = useCallback((step: number) => {
    setWizardState((prev) => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setWizardState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, TOTAL_STEPS),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setWizardState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 1),
    }));
  }, []);

  const handleCreateRoom = useCallback(() => {
    // Map wizard state to CreateRoomRequest
    const filters = [];

    // Add library filters
    if (wizardState.selectedLibraries.length > 0) {
      filters.push({
        key: "library",
        operator: "=",
        value: wizardState.selectedLibraries,
      });
    }

    // Add genre filters
    if (wizardState.genres.length > 0) {
      filters.push({
        key: "genre",
        operator: "=",
        value: wizardState.genres,
      });
    }

    // Add rating filter
    if (
      wizardState.ratingMin !== undefined ||
      wizardState.ratingMax !== undefined
    ) {
      const ratingFilter: string[] = [];
      if (wizardState.ratingMin !== undefined) {
        ratingFilter.push(`>=${wizardState.ratingMin}`);
      }
      if (wizardState.ratingMax !== undefined) {
        ratingFilter.push(`<=${wizardState.ratingMax}`);
      }
      filters.push({
        key: "rating",
        operator: ">=",
        value: ratingFilter,
      });
    }

    // Add content rating filter
    if (wizardState.contentRatings.length > 0) {
      filters.push({
        key: "contentRating",
        operator: "=",
        value: wizardState.contentRatings,
      });
    }

    // Add watched status filter
    if (wizardState.watchedStatus !== "all") {
      filters.push({
        key: "unwatched",
        operator: "=",
        value: [wizardState.watchedStatus === "unwatched" ? "true" : "false"],
      });
    }

    dispatch({
      type: "createRoom",
      payload: {
        roomName: wizardState.roomName,
        password: wizardState.password,
        filters,
        roomType: wizardState.roomType,
        sortOrder: wizardState.sortOrder,
        genreFilterMode: wizardState.genreMode,
      },
    });
  }, [wizardState, dispatch]);

  const renderStep = () => {
    switch (wizardState.step) {
      case 1:
        return (
          <RoomBasicInfo
            roomName={wizardState.roomName}
            password={wizardState.password}
            onUpdate={updateState}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <LibrarySelection
            selectedLibraries={wizardState.selectedLibraries}
            onUpdate={updateState}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <FilterConfiguration
            genres={wizardState.genres}
            genreMode={wizardState.genreMode}
            ratingMin={wizardState.ratingMin}
            ratingMax={wizardState.ratingMax}
            contentRatings={wizardState.contentRatings}
            watchedStatus={wizardState.watchedStatus}
            sortOrder={wizardState.sortOrder}
            onUpdate={updateState}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <RoomTypeSelection
            roomType={wizardState.roomType}
            onUpdate={updateState}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <RoomReview
            wizardState={wizardState}
            onEdit={goToStep}
            onCreate={handleCreateRoom}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className={styles.wizard}>
        {error && <ErrorMessage message={error.message ?? error.type ?? ""} />}

        {/* Progress Indicator */}
        <div className={styles.progressContainer}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
            <React.Fragment key={step}>
              <button
                className={`${styles.progressStep} ${
                  step === wizardState.step
                    ? styles.progressStepActive
                    : step < wizardState.step
                    ? styles.progressStepCompleted
                    : styles.progressStepInactive
                }`}
                onClick={() => step < wizardState.step && goToStep(step)}
                disabled={step > wizardState.step}
                aria-label={`Step ${step}`}
                aria-current={step === wizardState.step ? "step" : undefined}
              >
                {step < wizardState.step ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M13.5 4L6 11.5L2.5 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{step}</span>
                )}
              </button>
              {step < TOTAL_STEPS && (
                <div
                  className={`${styles.progressLine} ${
                    step < wizardState.step
                      ? styles.progressLineCompleted
                      : styles.progressLineInactive
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className={styles.stepContent}>{renderStep()}</div>
      </div>
    </Layout>
  );
};
