import React, {
  memo,
  ReactNode,
  useEffect,
  useReducer,
  useRef,
  useState,
  useCallback,
} from "react";
import type { Media } from "../../../../../types/moviematch";
import { useGesture } from "react-use-gesture";
import { animated, Controller, Spring } from "@react-spring/web";
import { Tr } from "../atoms/Tr";
import { useStore } from "../../store";

import styles from "./CardStack.module.css";
const { abs, sign } = Math;

// Export types for use in parent components
export type SwipeAction = "undo" | "reject" | "bookmark" | "like";
export type SwipeDirection = "left" | "right";

type Card = Media;

interface SwipeHistoryItem {
  card: Card;
  direction: SwipeDirection;
  index: number;
}

interface CardStackProps {
  cards: Card[];
  renderCard: (card: Card) => ReactNode;
  onCardDismissed: (card: Card, direction: SwipeDirection) => void;
  onUndo?: () => void;
  onBookmark?: (card: Card) => void;
  onStateChange?: (state: { canUndo: boolean; currentCard: Card | null }) => void;
}

// Optional hook for parent components that want to manage card state externally
// Note: CardStack manages its own state internally and exposes it via onStateChange callback
// This hook is provided for advanced use cases where external state management is needed
export const useCardStackState = () => {
  const [canUndo, setCanUndo] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<string>>(
    new Set(),
  );

  return {
    canUndo,
    setCanUndo,
    currentCard,
    setCurrentCard,
    bookmarkedCards,
    setBookmarkedCards,
  };
};

type Spring = {
  x: number;
  y: number;
  z: number;
  opacity: number;
};

const INITIAL_COUNT = 5;
const YZ_SIZE = 15;
const YZ_OFFSET = -30;

interface StackItem<T> {
  id: string;
  index: number;
  controller: Controller<Spring>;
  item: T;
  removed: boolean;
}

export const useViewportWidth = (transform?: (n: number) => number) => {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return transform ? transform(viewportWidth) : viewportWidth;
};

export const useFirstChildWidth = (transform?: (n: number) => number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const rect = ref.current?.firstElementChild?.getBoundingClientRect();
    if (rect) {
      setWidth(transform ? transform(rect.width) : rect.width);
    }
  }, [transform, ref]);
  return [ref, width] as const;
};

export const CardStack = memo(
  ({ cards, renderCard, onCardDismissed, onUndo, onBookmark, onStateChange }: CardStackProps) => {
    const vw = useViewportWidth((n) => n / 2);
    const [{ connectionStatus }] = useStore(["connectionStatus"]);
    const [elRef, ew] = useFirstChildWidth();

    // History management for undo functionality (max 10 items)
    const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);
    const [bookmarkedCards, setBookmarkedCards] = useState<Set<string>>(new Set());
    const HISTORY_LIMIT = 10;

    const [{ items }, dispatch] = useReducer(
      function reducer(
        { items, index }: { items: StackItem<Card>[]; index: number },
        action:
          | { type: "add" }
          | {
            type: "remove";
            payload: { id: string; direction: SwipeDirection };
          }
          | { type: "finalizeRemove"; payload: { id: string } }
          | { type: "undo"; payload: { card: Card; stackIndex: number } },
      ) {
        let newIndex = index;
        let newItems = items;

        switch (action.type) {
          case "add": {
            newIndex = index + 1;
            if (newIndex > cards.length) {
              return { items, index };
            }
            const [newCard] = cards.slice(index, newIndex);
            const controller = new Controller<Spring>({
              x: 0,
              y: YZ_OFFSET,
              z: YZ_OFFSET,
              opacity: 0,
            });
            newItems = [
              {
                id: newCard.id,
                item: newCard,
                index: 0,
                controller,
                removed: false,
              },
              ...items.map((item) => ({ ...item, index: item.index + 1 })),
            ];

            controller.start({ opacity: 1 });
            break;
          }
          case "remove": {
            const item = items.find((_) => _.id === action.payload.id);
            if (item) {
              const itemIndex = items.indexOf(item);

              if (item.controller.springs.x.idle) {
                item.controller
                  .start({
                    x: (action.payload.direction === "left" ? -1 : 1) *
                      (vw + ew),
                    config: { duration: 150 },
                  })
                  .then(() => {
                    dispatch({
                      type: "finalizeRemove",
                      payload: { id: action.payload.id },
                    });
                    onCardDismissed(item.item, action.payload.direction);
                  });
              }

              newItems = items.map((item, i) =>
                item.id === action.payload.id ? { ...item, removed: true } : {
                  ...item,
                  index: i > itemIndex ? item.index - 1 : item.index,
                }
              );
            }
            break;
          }
          case "finalizeRemove": {
            if (newItems.find((_) => _.id === action.payload.id)) {
              newItems = newItems.filter((_) => _.id !== action.payload.id);
            }
            break;
          }
          case "undo": {
            // Restore card to the stack at the original position
            const { card, stackIndex } = action.payload;
            newIndex = Math.max(stackIndex, index);

            const controller = new Controller<Spring>({
              x: 0,
              y: YZ_OFFSET,
              z: YZ_OFFSET,
              opacity: 0,
            });

            // Insert card back at the top of the stack
            newItems = [
              {
                id: card.id,
                item: card,
                index: 0,
                controller,
                removed: false,
              },
              ...items.map((item) => ({ ...item, index: item.index + 1 })),
            ];

            controller.start({ opacity: 1 });
            break;
          }
        }

        for (const item of newItems) {
          item.controller.start({
            y: YZ_SIZE * item.index + YZ_OFFSET,
            z: YZ_SIZE * item.index + YZ_OFFSET,
          });
        }

        return { index: newIndex, items: newItems };
      },
      {
        items: cards.slice(0, INITIAL_COUNT).map((card, i) => ({
          id: card.id,
          index: i,
          item: card,
          controller: new Controller<Spring>({
            x: 0,
            y: i * YZ_SIZE + YZ_OFFSET,
            z: i * YZ_SIZE + YZ_OFFSET,
            opacity: 1,
          }),
          removed: false,
        })),
        index: INITIAL_COUNT,
      },
    );

    const rateItem = (direction: SwipeDirection) => {
      const item = items.reduceRight<StackItem<Media> | null>(
        (item, _) => item || (!_.removed ? _ : null),
        null,
      );

      if (item) {
        // Add to history for undo functionality
        const historyItem: SwipeHistoryItem = {
          card: item.item,
          direction,
          index: items.length,
        };

        setSwipeHistory((prev) => {
          const newHistory = [...prev, historyItem];
          // Keep only last HISTORY_LIMIT items
          if (newHistory.length > HISTORY_LIMIT) {
            return newHistory.slice(-HISTORY_LIMIT);
          }
          return newHistory;
        });

        dispatch({
          type: "remove",
          payload: {
            id: item.id,
            direction,
          },
        });
        dispatch({ type: "add" });
      }
    };

    const handleUndo = useCallback(() => {
      if (swipeHistory.length > 0) {
        const lastSwipe = swipeHistory[swipeHistory.length - 1];

        // Remove last item from history
        setSwipeHistory((prev) => prev.slice(0, -1));

        // Restore card to stack
        dispatch({
          type: "undo",
          payload: {
            card: lastSwipe.card,
            stackIndex: lastSwipe.index,
          },
        });

        // Notify parent component
        if (onUndo) {
          onUndo();
        }
      }
    }, [swipeHistory, onUndo]);

    const handleBookmark = useCallback(() => {
      const item = items.reduceRight<StackItem<Media> | null>(
        (item, _) => item || (!_.removed ? _ : null),
        null,
      );

      if (item) {
        // Mark card as bookmarked without dismissing it
        setBookmarkedCards((prev) => new Set(prev).add(item.id));

        // Notify parent component
        if (onBookmark) {
          onBookmark(item.item);
        }
      }
    }, [items, onBookmark]);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (connectionStatus !== "connected") {
          return;
        }

        if (e.code === "ArrowLeft") {
          rateItem("left");
        } else if (e.code === "ArrowRight") {
          rateItem("right");
        } else if (e.code === "KeyZ" && (e.metaKey || e.ctrlKey)) {
          // Cmd/Ctrl+Z for undo
          e.preventDefault();
          handleUndo();
        } else if (e.code === "KeyB") {
          // B for bookmark
          handleBookmark();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [items, handleUndo, handleBookmark]);

    const bind = useGesture(
      {
        onDrag({ args: [id], down, delta: [x], movement: [mx] }) {
          console.log(id, down, x, mx);
          if (down && connectionStatus === "connected") {
            const p = abs(mx / (vw + ew));
            let isAfterId = false;
            items.forEach(({ removed, index, id: _id, controller }) => {
              if (!removed) {
                if (id === _id) {
                  controller.set({
                    x: (controller.springs as any).x.get() + x,
                    opacity: 1 - p,
                  });
                  isAfterId = true;
                } else {
                  const yz = p * (isAfterId ? -YZ_SIZE : YZ_SIZE) +
                    index * YZ_SIZE +
                    YZ_OFFSET;
                  controller.set({ y: yz, z: yz });
                }
              }
            });
          }
        },
        onDragEnd({ args: [id], movement: [x], velocities: [vx] }) {
          const p = abs(x / (vw + ew));
          if (p > 0.5 || (abs(vx) > 0.5 && connectionStatus === "connected")) {
            const direction: SwipeDirection = sign(x) === -1 ? "left" : "right";
            const item = items.find((_) => _.id === id);

            // Add to history for undo functionality
            if (item) {
              const historyItem: SwipeHistoryItem = {
                card: item.item,
                direction,
                index: items.length,
              };

              setSwipeHistory((prev) => {
                const newHistory = [...prev, historyItem];
                // Keep only last HISTORY_LIMIT items
                if (newHistory.length > HISTORY_LIMIT) {
                  return newHistory.slice(-HISTORY_LIMIT);
                }
                return newHistory;
              });
            }

            // TODO: dispatch is called once, but the
            // remove action is handled twice. Investigate why this
            // is, and if `useReducer` is the best tool for the job.
            dispatch({
              type: "remove",
              payload: {
                id,
                direction,
              },
            });
            dispatch({ type: "add" });
          } else {
            items.forEach(({ removed, index, id: _id, controller }) => {
              if (!removed) {
                if (id === _id) {
                  controller.start({ x: 0, opacity: 1 });
                } else {
                  const yz = index * YZ_SIZE + YZ_OFFSET;
                  controller.start({
                    y: yz,
                    z: yz,
                    config: { duration: 50, velocity: 1000 },
                  });
                }
              }
            });
          }
        },
      },
      { drag: { axis: "x" } },
    );

    const isEmpty = items.length === 0;

    // Get current card for parent components
    const currentCard = items.reduceRight<Card | null>(
      (card, item) => card || (!item.removed ? item.item : null),
      null,
    );

    // Export state that can be used by parent components
    // Parent can access via ref or by wrapping this component
    const canUndo = swipeHistory.length > 0;

    // Notify parent of state changes
    useEffect(() => {
      if (onStateChange) {
        onStateChange({ canUndo, currentCard });
      }
    }, [canUndo, currentCard, onStateChange]);

    return (
      <>
        <div className={isEmpty ? styles.emptyStack : styles.stack} ref={elRef}>
          {isEmpty && (
            <p className={styles.emptyText}>
              <Tr name="RATE_SECTION_EXHAUSTED_CARDS" />
            </p>
          )}
          {items.map((item) => {
            const { x, y, z, opacity } = item.controller.springs;
            return (
              <animated.div
                key={item.id}
                data-index={item.index}
                className={styles.item}
                style={{
                  x,
                  y,
                  z,
                  opacity: opacity.to([0.1, 0.8, 1], [0, 1, 1]),
                }}
                {...bind(item.id)}
              >
                {renderCard(item.item)}
              </animated.div>
            );
          })}
        </div>
      </>
    );
  },
  () => true,
);
