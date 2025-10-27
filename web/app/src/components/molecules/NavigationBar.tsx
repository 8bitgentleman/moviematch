import React from "react";
import { NavIcon } from "../atoms/NavIcon";
import { SwipeIcon } from "../icons/SwipeIcon";
import { GridIcon } from "../icons/GridIcon";
import { StarIcon } from "../icons/StarIcon";
import { SettingsIcon } from "../icons/SettingsIcon";
import styles from "./NavigationBar.module.css";

type TabType = "swipe" | "browse" | "matches" | "settings";

interface NavigationBarProps {
  activeTab: TabType;
  matchCount?: number;
  onTabChange: (tab: TabType) => void;
}

export const NavigationBar = ({
  activeTab,
  matchCount = 0,
  onTabChange,
}: NavigationBarProps) => {
  return (
    <nav className={styles.navigationBar} role="navigation" aria-label="Main navigation">
      <NavIcon
        icon={<SwipeIcon />}
        label="Swipe"
        isActive={activeTab === "swipe"}
        onClick={() => onTabChange("swipe")}
      />
      <NavIcon
        icon={<GridIcon />}
        label="Browse"
        isActive={activeTab === "browse"}
        onClick={() => onTabChange("browse")}
      />
      <NavIcon
        icon={<StarIcon />}
        label="Matches"
        isActive={activeTab === "matches"}
        badge={matchCount > 0 ? matchCount : undefined}
        onClick={() => onTabChange("matches")}
      />
      <NavIcon
        icon={<SettingsIcon />}
        label="Settings"
        isActive={activeTab === "settings"}
        onClick={() => onTabChange("settings")}
      />
    </nav>
  );
};
