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

export interface ContentCardProps {
  item: ContentBase;
  emphasis?: 'normal' | 'tall';
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, emphasis = 'normal' }) => {
  switch (item.sectionSlug) {
    case 'academy':
      return <CourseCard course={item as Course} emphasis={emphasis} />;
    case 'toolbox':
      return <ToolCard tool={item as Tool} emphasis={emphasis} />;
    case 'library':
      return <BookCard book={item as Book} emphasis={emphasis} />;
    case 'journey':
      return <ExperienceCard experience={item as Experience} emphasis={emphasis} />;
    case 'gathering':
      return <EventCard event={item as Event} emphasis={emphasis} />;
    case 'spark':
      return <IdeaCard idea={item as Idea} emphasis={emphasis} />;
    default:
      return <CourseCard course={item as Course} emphasis={emphasis} />;
  }
};

