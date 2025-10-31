import React, { useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { useAuthStore } from "../../store/authStore";
import { useRoomStore } from "../../store/roomStore";
import { client } from "../../store/websocket";
import { Avatar } from "../atoms/Avatar";
import { MenuButton } from "../atoms/MenuButton";
import { MenuGroup } from "../atoms/MenuGroup";
import { Popover } from "../atoms/Popover";

import styles from "./UserMenu.module.css";
import { UserProgressItem } from "./UserProgressItem";
import { ChevronDownIcon } from "../icons/ChevronDown";

export const UserMenu = () => {
  const user = useAuthStore((state) => state.user);
  const users = useRoomStore((state) => state.users);
  const [referenceEl, setReferenceEl] = useState<HTMLDivElement | null>();
  const [popperEl, setPopperEl] = useState<HTMLDivElement | null>();
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (popperEl?.contains(e.target) || referenceEl?.contains(e.target))
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mouseup", handleOutsideClick);
    return () => {
      document.removeEventListener("mouseup", handleOutsideClick);
    };
  }, [referenceEl, popperEl]);

  const popper = usePopper(referenceEl, popperEl, {
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 10],
        },
      },
      {
        name: "preventOverflow",
        options: {
          padding: 8,
        },
      },
    ],
  });

  useEffect(() => {
    setTimeout(() => {
      popper.forceUpdate && popper.forceUpdate();
    }, 10);
  }, [isOpen]);

  if (!user) return null;

  const areOthersInRoom = users && users.length > 1;
  const progress =
    users?.find((_) => _.user.userName === user.userName)?.progress ?? 0;

  return (
    <>
      <div
        className={styles.user}
        ref={setReferenceEl}
        role="button"
        onClick={() => {
          setOpen(!isOpen);
        }}
      >
        <ChevronDownIcon height="1.5rem" width="0.5rem" />
        {user && (
          <>
            <Avatar
              userName={user.userName}
              avatarUrl={user.avatarImage}
              progress={progress * 100}
            />
            <p className={styles.userName}>{user.userName}</p>
          </>
        )}
      </div>
      <Popover
        isOpen={isOpen}
        ref={setPopperEl}
        {...popper.attributes.popper}
        style={popper.styles.popper}
        arrowProps={popper.attributes.arrow}
        arrowStyles={popper.styles.arrow}
      >
        <UserProgressItem
          key={user.userName}
          user={user}
          progress={progress}
          style={!areOthersInRoom ? { marginBottom: "var(--s2)" } : {}}
        />
        <MenuGroup title="Also in the room:">
          {areOthersInRoom && (
            <div className={styles.usersList}>
              {users!.map((userProgress) => {
                if (userProgress.user.userName === user.userName) {
                  return null;
                }
                return (
                  <UserProgressItem
                    key={userProgress.user.userName}
                    {...userProgress}
                  />
                );
              })}
            </div>
          )}
        </MenuGroup>
        <MenuButton onClick={() => client.leaveRoom()}>
          Leave Room
        </MenuButton>
        <MenuButton onClick={() => client.logout()}>
          Logout
        </MenuButton>
      </Popover>
    </>
  );
};
