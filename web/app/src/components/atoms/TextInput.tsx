import React from "react";

import styles from "./TextInput.module.css";

interface TextInputProps {
  name: string;
  value?: string;
  type?: string;
  placeholder?: string;
  className?: string;
  paddingTop?: "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7";
  autoComplete?: string;
  invalid?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  testHandle?: string;
  "aria-label"?: string;
}

export const TextInput = ({
  value,
  name,
  type,
  placeholder,
  className,
  autoComplete,
  invalid,
  onChange,
  onBlur,
  paddingTop,
  testHandle,
  "aria-label": ariaLabel,
}: TextInputProps) => (
  <input
    className={`${styles.textInput} ${invalid ? styles.invalid : ""} ${className ?? ""}`}
    style={{
      ...(paddingTop ? { marginTop: `var(--${paddingTop})` } : {}),
    }}
    type={type ?? "text"}
    name={name}
    id={`${name}-text-input`}
    value={value}
    placeholder={placeholder}
    autoComplete={autoComplete ?? "off"}
    autoCorrect="off"
    onChange={onChange}
    onBlur={onBlur}
    aria-label={ariaLabel}
    data-test-handle={testHandle ?? `${name}-text-input`}
  />
);
