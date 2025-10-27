import React, { useState, useCallback } from "react";
import { Field } from "../../molecules/Field";
import { Button } from "../../atoms/Button";
import { ButtonContainer } from "../../layout/ButtonContainer";
import { Tr } from "../../atoms/Tr";
import type { WizardState } from "./CreateRoomWizard";

import styles from "./RoomBasicInfo.module.css";

interface RoomBasicInfoProps {
  roomName: string;
  password?: string;
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

export const RoomBasicInfo: React.FC<RoomBasicInfoProps> = ({
  roomName,
  password,
  onUpdate,
  onNext,
}) => {
  const [localRoomName, setLocalRoomName] = useState(roomName);
  const [localPassword, setLocalPassword] = useState(password ?? "");
  const [roomNameError, setRoomNameError] = useState<string | null>(null);

  const handleNext = useCallback(() => {
    if (!localRoomName.trim()) {
      setRoomNameError("Room name is required");
      return;
    }

    onUpdate({
      roomName: localRoomName,
      password: localPassword || undefined,
    });
    onNext();
  }, [localRoomName, localPassword, onUpdate, onNext]);

  const handleRoomNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalRoomName(e.target.value);
      setRoomNameError(null);
    },
    []
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalPassword(e.target.value);
    },
    []
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create a Room</h1>
        <p className={styles.description}>
          Set up a room name and optional password to get started
        </p>
      </div>

      <div className={styles.form}>
        <Field
          label={<Tr name="LOGIN_ROOM_NAME" />}
          name="roomName"
          value={localRoomName}
          errorMessage={roomNameError}
          onChange={handleRoomNameChange}
          autoComplete="off"
        />

        <Field
          label="Password (Optional)"
          name="password"
          value={localPassword}
          onChange={handlePasswordChange}
          autoComplete="new-password"
        />

        <div className={styles.infoBox}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.infoIcon}
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 6V10M10 14H10.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className={styles.infoText}>
            Share the room name with friends to let them join. Add a password
            for private rooms.
          </p>
        </div>
      </div>

      <ButtonContainer reverseMobile paddingTop="s3">
        <Button
          appearance="Primary"
          onPress={handleNext}
          disabled={!localRoomName.trim()}
          testHandle="basic-info-next"
        >
          Next
        </Button>
      </ButtonContainer>
    </div>
  );
};
