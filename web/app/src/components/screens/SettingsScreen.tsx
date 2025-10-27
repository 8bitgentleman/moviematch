import React, { useState, useCallback } from "react";
import type { User } from "../../../../../types/moviematch";
import { NavigationBar } from "../molecules/NavigationBar";
import { Avatar } from "../atoms/Avatar";
import { UserProgressItem } from "../molecules/UserProgressItem";
import styles from "./SettingsScreen.module.css";

type TabType = "swipe" | "browse" | "matches" | "settings";

interface Participant {
  user: User;
  progress: number;
}

interface SettingsScreenProps {
  roomName: string;
  participants: Participant[];
  user: User;
  matchCount?: number;
  onLeaveRoom: () => void;
  onLogout?: () => void;
  onTabChange: (tab: TabType) => void;
  createdAt?: number;
}

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return "Recently";

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
};

export const SettingsScreen = ({
  roomName,
  participants,
  user,
  matchCount = 0,
  onLeaveRoom,
  onLogout,
  onTabChange,
  createdAt,
}: SettingsScreenProps) => {
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      const roomUrl = `${window.location.origin}/room/${encodeURIComponent(roomName)}`;
      await navigator.clipboard.writeText(roomUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  }, [roomName]);

  const handleLeaveClick = useCallback(() => {
    setShowLeaveConfirmation(true);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    onLeaveRoom();
    setShowLeaveConfirmation(false);
  }, [onLeaveRoom]);

  const handleCancelLeave = useCallback(() => {
    setShowLeaveConfirmation(false);
  }, []);

  const isAuthenticated = user.avatarImage !== undefined;

  return (
    <div className={styles.settingsScreen}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Room Info Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Room</h2>

          <div className={styles.card}>
            <div className={styles.roomInfo}>
              <div className={styles.roomIcon}>🎬</div>
              <div className={styles.roomDetails}>
                <h3 className={styles.roomName}>{roomName}</h3>
                <p className={styles.roomMeta}>
                  {participants.length} {participants.length === 1 ? "participant" : "participants"} • Created {formatDate(createdAt)}
                </p>
              </div>
            </div>

            <button
              className={styles.shareButton}
              onClick={handleCopyLink}
              type="button"
            >
              <span className={styles.shareIcon}>
                {copySuccess ? "✓" : "📋"}
              </span>
              {copySuccess ? "Link copied!" : "Copy room link"}
            </button>
          </div>
        </section>

        {/* Participants Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Participants</h2>

          <div className={styles.card}>
            <div className={styles.participantsList}>
              {participants.map((participant) => (
                <UserProgressItem
                  key={participant.user.userName}
                  user={participant.user}
                  progress={participant.progress}
                />
              ))}
            </div>
          </div>
        </section>

        {/* User Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Profile</h2>

          <div className={styles.card}>
            <div className={styles.profileInfo}>
              <Avatar
                userName={user.userName}
                avatarUrl={user.avatarImage}
              />
              <div className={styles.profileDetails}>
                <h3 className={styles.profileName}>{user.userName}</h3>
                {isAuthenticated && (
                  <p className={styles.profileStatus}>
                    <span className={styles.statusIndicator} />
                    Connected to Plex
                  </p>
                )}
              </div>
            </div>

            {isAuthenticated && onLogout && (
              <button
                className={styles.logoutButton}
                onClick={onLogout}
                type="button"
              >
                Logout from Plex
              </button>
            )}
          </div>
        </section>

        {/* Actions Section */}
        <section className={styles.section}>
          <div className={styles.card}>
            <button
              className={styles.leaveButton}
              onClick={handleLeaveClick}
              type="button"
            >
              Leave Room
            </button>
          </div>
        </section>

        {/* App Info */}
        <div className={styles.appInfo}>
          <p className={styles.appVersion}>MovieMatch v3.0</p>
          <p className={styles.appCopyright}>© 2024 MovieMatch</p>
        </div>
      </div>

      {/* Bottom navigation */}
      <NavigationBar
        activeTab="settings"
        matchCount={matchCount}
        onTabChange={onTabChange}
      />

      {/* Leave Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className={styles.modalOverlay} onClick={handleCancelLeave}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
          >
            <h3 className={styles.modalTitle} id="leave-modal-title">
              Leave Room?
            </h3>
            <p className={styles.modalMessage}>
              Are you sure you want to leave "{roomName}"? You can rejoin later
              if the room is still active.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={handleCancelLeave}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.modalConfirm}
                onClick={handleConfirmLeave}
                type="button"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
