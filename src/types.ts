export interface Book {
  title: string;
  author: string;
  genre?: string;
  ageLevel?: string;
  publicationYear?: number;
  sharedBy?: string;
  description: string;
  coverImage: string;
  availability: string;
}