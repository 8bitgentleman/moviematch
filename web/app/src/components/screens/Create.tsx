import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Filter } from "../../../../../types/moviematch";
import { useAuthStore } from "../../store/authStore";
import { useMediaStore } from "../../store/mediaStore";
import { useUIStore } from "../../store/uiStore";
import { client } from "../../store/websocket";
import { Button } from "../atoms/Button";
import { ButtonContainer } from "../layout/ButtonContainer";
import { ErrorMessage } from "../atoms/ErrorMessage";
import { Field } from "../molecules/Field";
import { FilterField } from "../molecules/FilterField";
import { AddRemoveList } from "../atoms/AddRemoveList";
import { Layout } from "../layout/Layout";
import { Tr } from "../atoms/Tr";

import styles from "./Create.module.css";

export const CreateScreen = () => {
  const translations = useAuthStore((state) => state.translations);
  const availableFilters = useMediaStore((state) => state.availableFilters);
  const filterValues = useMediaStore((state) => state.filterValues);
  const error = useUIStore((state) => state.error);
  const routeParams = useUIStore((state) => state.routeParams);
  const navigate = useUIStore((state) => state.navigate);

  const [roomName, setRoomName] = useState<string>(routeParams?.roomName ?? "");
  const [roomNameError, setRoomNameError] = useState<string | null>(null);
  const filters = useRef(new Map<number, Filter>());
  const handleCreateRoom = useCallback(async () => {
    if (!roomName) {
      setRoomNameError(translations?.FIELD_REQUIRED_ERROR!);
      return;
    }

    if (roomName) {
      client.createRoom({
        roomName,
        filters: [...filters.current.values()],
      });
    }
  }, [roomName]);

  useEffect(() => {
    client.requestFilters();
  }, []);

  return (
    <Layout>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {error && <ErrorMessage message={error.message ?? error.type ?? ""} />}
        <Field
          label={<Tr name="LOGIN_ROOM_NAME" />}
          name="roomName"
          value={roomName}
          errorMessage={roomNameError}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <div className={styles.filters}>
          <h2 className={styles.filtersTitle}>Filters</h2>
          <AddRemoveList
            initialChildren={0}
            onRemove={(i) => filters.current.delete(i)}
            testHandle="filter"
          >
            {(i) =>
              availableFilters && (
                <FilterField
                  key={i}
                  name={String(i)}
                  onChange={(filter) =>
                    filter && filters.current.set(i, filter)}
                  filters={availableFilters}
                  suggestions={filterValues}
                  requestSuggestions={(key: string) => {
                    client.requestFilterValues({ key });
                  }}
                />
              )}
          </AddRemoveList>
        </div>

        <ButtonContainer reverseMobile paddingTop="s3">
          <Button
            appearance="Tertiary"
            onPress={() =>
              navigate("join")}
            testHandle="back"
          >
            <Tr name="BACK" />
          </Button>
          <Button
            appearance="Primary"
            onPress={handleCreateRoom}
            testHandle="create-room"
          >
            <Tr name="CREATE_ROOM" />
          </Button>
        </ButtonContainer>
      </form>
    </Layout>
  );
};
