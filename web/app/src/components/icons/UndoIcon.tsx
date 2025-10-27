import React from "react";
import { IconProps, iconProps } from "./Icon";

export const UndoIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...iconProps(props)}
  >
    <path
      d="M5.5 9.5L2.5 12.5L5.5 15.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 12.5H15.5C18.2614 12.5 20.5 10.2614 20.5 7.5C20.5 4.73858 18.2614 2.5 15.5 2.5H14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
