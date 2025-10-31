import React, { useEffect, useState } from "react";
import { Field } from "../molecules/Field";
import { Button } from "../atoms/Button";
import { ButtonContainer } from "../layout/ButtonContainer";
import { Layout } from "../layout/Layout";
import { Tr } from "../atoms/Tr";
import styles from "./Join.module.css";
import { useRoomStore } from "../../store/roomStore";
import { useUIStore } from "../../store/uiStore";
import { client } from "../../store/websocket";
import { ErrorMessage } from "../atoms/ErrorMessage";
import { Spinner } from "../atoms/Spinner";

export const JoinScreen = () => {
  const room = useRoomStore((state) => state.name);
  const error = useUIStore((state) => state.error);
  const navigate = useUIStore((state) => state.navigate);
  const [initialRoomName] = useState<string | null>(
    new URLSearchParams(location.search).get("roomName"),
  );
  const [roomName, setRoomName] = useState<string>(
    room ?? initialRoomName ?? "",
  );
  const [roomNameError] = useState<string | undefined>();

  useEffect(() => {
    if (initialRoomName) {
      client.joinRoom({ roomName: initialRoomName });
    }
  }, [initialRoomName]);

  if (initialRoomName && !error) {
    return <Layout>
      <Spinner />
    </Layout>;
  }

  return (
    <Layout>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {error &&
          <ErrorMessage
            message={error.message ?? error.type ?? ""}
          />}
        <Field
          label="Room Name"
          name="roomName"
          value={roomName}
          errorMessage={roomNameError}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <ButtonContainer paddingTop="s7" reverseMobile>
          <Button
            appearance="Tertiary"
            onPress={() => {
              client.logout();
            }}
            testHandle="logout"
          >
            <Tr name="LOGOUT" />
          </Button>
          <Button
            appearance="Secondary"
            onPress={() => {
              navigate("createRoom", { roomName });
            }}
            testHandle="create-room"
          >
            <Tr name="CREATE_ROOM" />
          </Button>
          <Button
            appearance="Primary"
            onPress={() => {
              if (roomName) {
                client.joinRoom({ roomName });
              }
            }}
            type="submit"
            testHandle="join-room"
          >
            <Tr name="JOIN_ROOM" />
          </Button>
        </ButtonContainer>
      </form>
    </Layout>
  );
};
