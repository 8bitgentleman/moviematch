import React from "react";
import { useAuthStore } from "../../store/authStore";
import { useRoomStore } from "../../store/roomStore";
import { useUIStore } from "../../store/uiStore";
import { ShareIcon } from "../icons/ShareIcon";

import styles from "./ShareMenu.module.css";

export const ShareMenu = () => {
  const roomName = useRoomStore((state) => state.name);
  const translations = useAuthStore((state) => state.translations);
  const addToast = useUIStore((state) => state.addToast);

  if (!roomName) return null;

  const handleShare = async () => {
    const shareUrl = new URL(location.origin);
    shareUrl.searchParams.set("roomName", roomName);
    try {
      await navigator.clipboard.writeText(shareUrl.href);
      addToast({
        id: Date.now(),
        showTimeMs: 2_000,
        message: translations?.COPY_LINK_SUCCESS ?? "COPY_LINK_SUCCESS",
        appearance: "Success",
      });
    } catch (err) {
      addToast({
        id: Date.now(),
        showTimeMs: 2_000,
        message: translations?.COPY_LINK_FAILURE ?? "COPY_LINK_FAILURE",
        appearance: "Failure",
      });
    }
  };

  return (
    <button className={styles.shareButton} onClick={handleShare}>
      <span className={styles.roomName}>{roomName}</span>
      <ShareIcon size="1.4rem" />
    </button>
  );
};
