import {
  SectionSlug,
  ContentBase,
  Course,
  Tool,
  Book,
  Experience,
  Idea,
  Event,
  BlogPost,
  Comment,
  Submission,
  SavedCanvas,
  Paginated,
} from '../types';
import { MOCK_COURSES } from './courses';
import { MOCK_TOOLS } from './tools';
import { MOCK_BOOKS } from './books';
import { MOCK_EXPERIENCES } from './experiences';
import { MOCK_EVENTS } from './events';
import { MOCK_IDEAS } from './ideas';
import { MOCK_BLOG_POSTS } from './blog';
import {
  MOCK_CURRENT_USER,
  MOCK_SUBMISSIONS,
  MOCK_SAVED_CANVASES,
  MOCK_POINT_ENTRIES,
} from './user';
import { SECTION_LIST } from '../config/sections';

// In-memory state holding mutable records (saved to localStorage when in mock mode)
import { liveDb } from '../services/db';

export const mockDb = liveDb;

export function paginateArray<T>(items: T[], page = 1, pageSize = 12): Paginated<T> {
  const startIndex = (page - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);
  const total = items.length;
  return {
    items: pageItems,
    total,
    page,
    pageSize,
    hasMore: startIndex + pageSize < total,
  };
}

export {
  MOCK_COURSES,
  MOCK_TOOLS,
  MOCK_BOOKS,
  MOCK_EXPERIENCES,
  MOCK_EVENTS,
  MOCK_IDEAS,
  MOCK_BLOG_POSTS,
  MOCK_CURRENT_USER,
  MOCK_SUBMISSIONS,
  MOCK_SAVED_CANVASES,
  MOCK_POINT_ENTRIES,
  SECTION_LIST,
};
