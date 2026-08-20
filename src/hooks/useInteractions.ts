import { useState } from 'react';
import { useAuth } from './useAuth';
import { likeContent, unlikeContent, bookmarkContent, unbookmarkContent } from '../services/endpoints';
import { ContentBase } from '../types';

export function useInteractions(initialContent: ContentBase) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState<ContentBase>(initialContent);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = content.isLikedByMe;
    const prevCount = content.likeCount;

    // Optimistic update
    setContent((prev) => ({
      ...prev,
      isLikedByMe: !prevLiked,
      likeCount: prevLiked ? prevCount - 1 : prevCount + 1,
    }));

    try {
      if (prevLiked) {
        await unlikeContent(content.id);
      } else {
        await likeContent(content.id);
      }
    } catch {
      // Rollback on failure
      setContent((prev) => ({
        ...prev,
        isLikedByMe: prevLiked,
        likeCount: prevCount,
      }));
    } finally {
      setIsLiking(false);
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (isBookmarking) return;
    setIsBookmarking(true);

    const prevBookmarked = content.isBookmarkedByMe;

    // Optimistic update
    setContent((prev) => ({
      ...prev,
      isBookmarkedByMe: !prevBookmarked,
    }));

    try {
      if (prevBookmarked) {
        await unbookmarkContent(content.id);
      } else {
        await bookmarkContent(content.id);
      }
    } catch {
      // Rollback on failure
      setContent((prev) => ({
        ...prev,
        isBookmarkedByMe: prevBookmarked,
      }));
    } finally {
      setIsBookmarking(false);
    }
  };

  return {
    content,
    setContent,
    isLiked: content.isLikedByMe,
    likeCount: content.likeCount,
    isBookmarked: content.isBookmarkedByMe,
    toggleLike,
    toggleBookmark,
    isLoginModalOpen,
    setIsLoginModalOpen,
  };
}
