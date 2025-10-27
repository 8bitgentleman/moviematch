import React, { useState, useCallback } from "react";
import type { Media } from "../../../../../types/moviematch";
import { CardStack } from "../organisms/CardStack";
import { MovieCard } from "../molecules/MovieCard";
import { MovieInfo } from "../molecules/MovieInfo";
import { ActionBar } from "../molecules/ActionBar";
import { NavigationBar } from "../molecules/NavigationBar";
import { ProgressBar } from "../atoms/ProgressBar";
import { MovieDetails } from "../organisms/MovieDetails";
import { TrailerViewer } from "../organisms/TrailerViewer";
import styles from "./SwipeScreen.module.css";

type TabType = "swipe" | "browse" | "matches" | "settings";

interface SwipeScreenProps {
  media: Media[];
  onSwipe: (mediaId: string, action: "like" | "dislike") => void;
  onBookmark?: (media: Media) => void;
  isAuthenticated?: boolean;
  matchCount?: number;
  onTabChange: (tab: TabType) => void;
}

export const SwipeScreen = ({
  media,
  onSwipe,
  onBookmark,
  isAuthenticated = false,
  matchCount = 0,
  onTabChange,
}: SwipeScreenProps) => {
  // Carousel state: 0 = poster, 1 = details overlay, 2 = trailer
  const [carouselPage, setCarouselPage] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [currentCard, setCurrentCard] = useState<Media | null>(null);
  const [swipeHandlers, setSwipeHandlers] = useState<{
    swipeLeft: () => void;
    swipeRight: () => void;
  } | null>(null);

  // Get current media for display
  const currentMedia = currentCard || media[0];

  // Handle card tap - cycle through carousel pages
  const handleCardTap = useCallback(() => {
    setCarouselPage((prev) => (prev + 1) % 3);
  }, []);

  // Action handlers - use CardStack's swipe animation
  const handleUndo = useCallback(() => {
    // CardStack handles undo internally via onUndo callback
  }, []);

  const handleReject = useCallback(() => {
    if (swipeHandlers && currentMedia) {
      swipeHandlers.swipeLeft();
      setCarouselPage(0); // Reset carousel on swipe
    }
  }, [swipeHandlers, currentMedia]);

  const handleLike = useCallback(() => {
    if (swipeHandlers && currentMedia) {
      swipeHandlers.swipeRight();
      setCarouselPage(0); // Reset carousel on swipe
    }
  }, [swipeHandlers, currentMedia]);

  const handleBookmark = useCallback(() => {
    if (currentMedia && onBookmark) {
      onBookmark(currentMedia);
    }
  }, [currentMedia, onBookmark]);

  // Info button - open full details modal
  const handleInfoClick = useCallback(() => {
    setShowDetailsModal(true);
  }, []);

  // CardStack callbacks
  const handleCardDismissed = useCallback(
    (card: Media, direction: "left" | "right") => {
      const action = direction === "right" ? "like" : "dislike";
      onSwipe(card.id, action);
      setCarouselPage(0); // Reset carousel
    },
    [onSwipe]
  );

  const handleCardStackStateChange = useCallback(
    (state: { canUndo: boolean; currentCard: Media | null }) => {
      setCanUndo(state.canUndo);
      setCurrentCard(state.currentCard);
    },
    []
  );

  // Show trailer if available and carousel is on page 2
  const showTrailerOverlay = carouselPage === 2 && currentMedia?.linkUrl;

  return (
    <div className={styles.swipeScreen}>
      {/* Progress indicators at top */}
      <div className={styles.progressBarContainer}>
        <ProgressBar total={3} current={carouselPage} onPageChange={setCarouselPage} />
      </div>

      {/* Main card area */}
      <div className={styles.cardArea} onClick={handleCardTap}>
        <CardStack
          cards={media}
          renderCard={(card) => (
            <div className={styles.cardWrapper}>
              <MovieCard posterUrl={card.posterUrl || ""} title={card.title} />

              {/* Details overlay on page 1 */}
              {carouselPage === 1 && card.id === currentMedia?.id && (
                <div className={styles.detailsOverlay}>
                  <div className={styles.overlayContent}>
                    <h2 className={styles.overlayTitle}>{card.title}</h2>
                    {card.year && (
                      <p className={styles.overlayYear}>{card.year}</p>
                    )}
                    {card.description && (
                      <p className={styles.overlayDescription}>
                        {card.description}
                      </p>
                    )}
                    {card.rating > 0 && (
                      <p className={styles.overlayRating}>
                        ★ {card.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          onCardDismissed={handleCardDismissed}
          onStateChange={handleCardStackStateChange}
          onBookmark={onBookmark}
          onSwipeRequest={setSwipeHandlers}
        />

        {/* Trailer/Link overlay on page 2 - Opens in Plex instead of iframe due to X-Frame-Options */}
        {showTrailerOverlay && (
          <div className={styles.trailerOverlay}>
            <div style={{ textAlign: 'center', padding: '24px', color: '#ffffff' }}>
              <h3 style={{ marginBottom: '16px' }}>View in Plex</h3>
              <p style={{ marginBottom: '24px', color: '#b3b3b3' }}>
                This movie can be viewed directly in your Plex app
              </p>
              <a
                href={currentMedia.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#ff9500',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Open in Plex
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Movie info bar */}
      {currentMedia && (
        <div className={styles.infoBar}>
          <MovieInfo
            title={currentMedia.title}
            duration={currentMedia.duration}
            genres={currentMedia.genres || []}
            onInfoClick={handleInfoClick}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.actionBarContainer}>
        <ActionBar
          onUndo={handleUndo}
          onReject={handleReject}
          onBookmark={handleBookmark}
          onLike={handleLike}
          canUndo={canUndo}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Bottom navigation */}
      <NavigationBar
        activeTab="swipe"
        matchCount={matchCount}
        onTabChange={onTabChange}
      />

      {/* Modals */}
      {showDetailsModal && currentMedia && (
        <MovieDetails
          media={currentMedia}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showTrailerModal && currentMedia?.linkUrl && (
        <TrailerViewer
          trailerUrl={currentMedia.linkUrl}
          posterUrl={currentMedia.posterUrl}
          onClose={() => setShowTrailerModal(false)}
        />
      )}
    </div>
  );
};
