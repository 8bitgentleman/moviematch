import React, { useState } from "react";
import styles from "./Login.module.css";
import { Field } from "../molecules/Field";
import { Button } from "../atoms/Button";
import { ButtonContainer } from "../layout/ButtonContainer";
import { Layout } from "../layout/Layout";
import { Tr } from "../atoms/Tr";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { client } from "../../store/websocket";
import { ErrorMessage } from "../atoms/ErrorMessage";

export const LoginScreen = () => {
  const config = useAuthStore((state) => state.config);
  const translations = useAuthStore((state) => state.translations);
  const error = useUIStore((state) => state.error);
  const initPlexLogin = useAuthStore((state) => state.initPlexLogin);
  const [userName, setUserName] = useState<string | null>(
    localStorage.getItem("userName"),
  );
  const [userNameError, setUserNameError] = useState<string | undefined>();

  return (
    <Layout>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {error && (
          <ErrorMessage message={error.message ?? error.type ?? ""} />
        )}
        {!config?.requirePlexLogin && (
          <Field
            label={<Tr name="LOGIN_NAME" />}
            name="given-name"
            autoComplete="given-name"
            value={userName ?? ""}
            onChange={(e) => setUserName(e.target.value)}
            errorMessage={userNameError}
          />
        )}

        <ButtonContainer paddingTop="s7">
          {!config?.requirePlexLogin && (
            <Button
              appearance="Primary"
              onPress={async () => {
                if (!userName) {
                  setUserNameError(translations?.FIELD_REQUIRED_ERROR!);
                  return;
                }
                client.login({ userName });
              }}
              testHandle="login-anonymous"
            >
              <Tr name="LOGIN_SIGN_IN" />
            </Button>
          )}
          <Button
            appearance="Primary"
            color="plex-color"
            highlightColor="plex-highlight-color"
            testHandle="login-plex"
            onPress={() => {
              initPlexLogin();
            }}
          >
            <Tr name="LOGIN_SIGN_IN_PLEX" />
          </Button>
        </ButtonContainer>
      </form>
    </Layout>
  );
};
