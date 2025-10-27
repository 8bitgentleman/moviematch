import React from "react";
import { IconProps, iconProps } from "./Icon";

export const SwipeIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...iconProps(props)}
  >
    <path
      d="M4 8L8 4M8 4L12 8M8 4V14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 16L16 20M16 20L12 16M16 20V10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
