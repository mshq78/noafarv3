import React from 'react';
import { CourseCard } from './CourseCard';
import { ToolCard } from './ToolCard';
import { BookCard } from './BookCard';
import { ExperienceCard } from './ExperienceCard';
import { EventCard } from './EventCard';
import { IdeaCard } from './IdeaCard';
import { BlogPostCard } from './BlogPostCard';
import {
  ContentBase,
  Course,
  Tool,
  Book,
  Experience,
  Event,
  Idea,
} from '../../types';

export * from './CourseCard';
export * from './ToolCard';
export * from './BookCard';
export * from './ExperienceCard';
export * from './EventCard';
export * from './IdeaCard';
export * from './BlogPostCard';

export const ContentCard: React.FC<{ item: ContentBase }> = ({ item }) => {
  switch (item.sectionSlug) {
    case 'academy':
      return <CourseCard course={item as Course} />;
    case 'toolbox':
      return <ToolCard tool={item as Tool} />;
    case 'library':
      return <BookCard book={item as Book} />;
    case 'journey':
      return <ExperienceCard experience={item as Experience} />;
    case 'gathering':
      return <EventCard event={item as Event} />;
    case 'spark':
      return <IdeaCard idea={item as Idea} />;
    default:
      return <CourseCard course={item as Course} />;
  }
};
