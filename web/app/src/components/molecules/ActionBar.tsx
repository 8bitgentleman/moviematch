import React from "react";
import { ActionButton } from "../atoms/ActionButton";
import { UndoIcon } from "../icons/UndoIcon";
import { XIcon } from "../icons/XIcon";
import { BookmarkIcon } from "../icons/BookmarkIcon";
import { HeartIcon } from "../icons/HeartIcon";
import styles from "./ActionBar.module.css";

interface ActionBarProps {
  onUndo?: () => void;
  onReject?: () => void;
  onBookmark?: () => void;
  onLike?: () => void;
  canUndo?: boolean;
  isAuthenticated?: boolean;
}

export const ActionBar = ({
  onUndo,
  onReject,
  onBookmark,
  onLike,
  canUndo = false,
  isAuthenticated = false,
}: ActionBarProps) => {
  return (
    <div className={styles.actionBar}>
      <ActionButton
        icon={<UndoIcon />}
        color="undo"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        ariaLabel="Undo last swipe"
      />
      <ActionButton
        icon={<XIcon />}
        color="reject"
        size="lg"
        onClick={onReject}
        ariaLabel="Reject and skip"
      />
      <ActionButton
        icon={<BookmarkIcon />}
        color="bookmark"
        size="md"
        onClick={onBookmark}
        disabled={!isAuthenticated}
        ariaLabel="Add to watchlist"
      />
      <ActionButton
        icon={<HeartIcon />}
        color="like"
        size="lg"
        onClick={onLike}
        ariaLabel="Like and match"
      />
    </div>
  );
};
