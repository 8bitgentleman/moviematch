import React, { useState, useCallback } from "react";
import { Button } from "../../atoms/Button";
import { ButtonContainer } from "../../layout/ButtonContainer";
import type { WizardState } from "./CreateRoomWizard";
import type { RoomType } from "../../../../../../types/moviematch";

import styles from "./RoomTypeSelection.module.css";

interface RoomTypeSelectionProps {
  roomType: RoomType;
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface RoomTypeOption {
  type: RoomType;
  icon: string;
  name: string;
  description: string;
  useCase: string;
}

const ROOM_TYPES: RoomTypeOption[] = [
  {
    type: "standard",
    icon: "👥",
    name: "Standard",
    description: "Everyone swipes independently. First match wins!",
    useCase: "Perfect for casual group movie nights",
  },
  {
    type: "unanimous",
    icon: "🎯",
    name: "Unanimous",
    description: "Everyone must agree on a match",
    useCase: "Best when everyone needs to love the choice",
  },
  {
    type: "solo",
    icon: "🎬",
    name: "Solo",
    description: "Browse and pick movies by yourself",
    useCase: "Great for personal watchlist curation",
  },
  {
    type: "async",
    icon: "⏰",
    name: "Async",
    description: "Swipe at your own pace. Results when ready.",
    useCase: "Ideal when not everyone is online at once",
  },
];

export const RoomTypeSelection: React.FC<RoomTypeSelectionProps> = ({
  roomType,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [localRoomType, setLocalRoomType] = useState<RoomType>(roomType);

  const handleNext = useCallback(() => {
    onUpdate({ roomType: localRoomType });
    onNext();
  }, [localRoomType, onUpdate, onNext]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose Room Type</h1>
        <p className={styles.description}>
          Select how matches will be determined
        </p>
      </div>

      <div className={styles.cardGrid}>
        {ROOM_TYPES.map((option) => (
          <button
            key={option.type}
            type="button"
            className={`${styles.card} ${
              localRoomType === option.type ? styles.cardSelected : ""
            }`}
            onClick={() => setLocalRoomType(option.type)}
            aria-pressed={localRoomType === option.type}
          >
            {localRoomType === option.type && (
              <div className={styles.radioIndicator}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="10" fill="currentColor" />
                  <path
                    d="M14 7L8.5 12.5L6 10"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <div className={styles.cardIcon}>{option.icon}</div>
            <h3 className={styles.cardName}>{option.name}</h3>
            <p className={styles.cardDescription}>{option.description}</p>
            <div className={styles.cardUseCase}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.useCaseIcon}
                aria-hidden="true"
              >
                <path
                  d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 5V8L10 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.useCaseText}>{option.useCase}</span>
            </div>
          </button>
        ))}
      </div>

      <ButtonContainer reverseMobile paddingTop="s3">
        <Button
          appearance="Tertiary"
          onPress={onBack}
          testHandle="room-type-back"
        >
          Back
        </Button>
        <Button
          appearance="Primary"
          onPress={handleNext}
          testHandle="room-type-next"
        >
          Next
        </Button>
      </ButtonContainer>
    </div>
  );
};
