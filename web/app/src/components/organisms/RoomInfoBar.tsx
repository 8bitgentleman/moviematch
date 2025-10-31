import React from "react";
import { Tr } from "../atoms/Tr";

import styles from "./RoomInfoBar.module.css";
import { useRoomStore } from "../../store/roomStore";
import { UserMenu } from "../molecules/UserMenu";
import { ShareMenu } from "../molecules/ShareMenu";

export const RoomInfoBar = () => {
  const matches = useRoomStore((state) => state.matches);

  return (
    <div className={styles.infoBar}>
      <div className={styles.item}>
        <UserMenu />
      </div>
      <div className={styles.matchCountWrapper}>
        <p className={styles.matchCount}>
          {(matches ?? []).length}
        </p>
        <p className={styles.matchCountTitle}>
          <Tr name="MATCHES_SECTION_TITLE" />
        </p>
      </div>
      <div className={styles.item}>
        <ShareMenu />
      </div>
    </div>
  );
};
