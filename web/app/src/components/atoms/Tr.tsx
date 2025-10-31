import React, { memo } from "react";
import { useAuthStore } from "../../store/authStore";
import type { TranslationKey } from "../../../../../types/moviematch";

interface TranslationProps {
  name: TranslationKey;
  context?: Record<string, string>;
}

/**
 * A simple interpolate function
 * @example interpolate("foo ${bar} baz", { bar: "abc" }) => "foo abc baz"
 */
const interpolate = (text: string, context: Record<string, string>) => {
  let interpolatedText = text;
  for (const [, match, name] of text.matchAll(/(\$\{([a-z0-9_]+)\})/gi)) {
    interpolatedText = interpolatedText.replace(match, context[name]);
  }
  return interpolatedText;
};

export const Tr = memo(({ name, context }: TranslationProps) => {
  const translations = useAuthStore((state) => state.translations);
  const translation = (translations ?? {})[name];

  if (translation && context) {
    return <>{interpolate(translation, context)}</>;
  }

  return <>{translation ?? name}</>;
});
