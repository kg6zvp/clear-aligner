import { Word } from '../../structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { BookInfo } from '../../workbench/books';

export interface Verse {
  reference: number;
}

export interface Chapter {
  reference: number;
  verses: Verse[];
}

export interface NavigableBook extends BookInfo {
  index: number;
  chapters: Chapter[];
}

export const getReferenceListFromWords = (words: Word[]): NavigableBook[] =>
  words
    .map((word) => word.id)
    .map(BCVWP.parseFromString)
    .filter((ref) =>
      ref.hasFields(
        BCVWPField.Book,
        BCVWPField.Chapter,
        BCVWPField.Verse,
        BCVWPField.Word
      )
    )
    .map(
      (ref): NavigableBook => ({
        index: ref.book! - 1,
        ...ref.getBookInfo()!,
        chapters: [
          {
            reference: ref.chapter ?? 0,
            verses: [
              {
                reference: ref.verse ?? 0
              }
            ]
          }
        ]
      })
    )
    /**
     * merge the individual verse references into books with lists of available chapters and verses
     */
    .reduce((accumulator, currentReference): NavigableBook[] => {
      const book = accumulator.find(
        (book) => book.index === currentReference.index
      );
      if (!book) {
        // add book
        return [...accumulator, currentReference];
      }
      const currentChapter = currentReference.chapters[0];
      const chapter = book.chapters.find(
        (chapter) => chapter.reference === currentChapter.reference
      );
      if (!chapter) {
        // add chapter
        book.chapters = [...book.chapters, currentChapter].sort(
          (a, b): number => a.reference - b.reference
        );
        return [
          ...accumulator.filter((b) => b.index !== currentReference.index),
          book
        ];
      }
      const currentVerse = currentChapter.verses[0];
      const verse = chapter.verses.find(
        (verse) => verse.reference === currentVerse.reference
      );
      if (!verse) {
        // add verse
        chapter.verses = [...chapter.verses, currentVerse].sort(
          (a, b): number => a.reference - b.reference
        );
        return [
          ...accumulator.filter((b) => b.index !== currentReference.index),
          book
        ];
      }
      return accumulator;
    }, [] as NavigableBook[])
    .sort((a, b): number => a.BookNumber - b.BookNumber);

export const findBookInNavigableBooksByBookNumber = (
  navigableBooks: NavigableBook[],
  bookNumber?: number
): NavigableBook | null =>
  bookNumber
    ? navigableBooks.find((book) => book.BookNumber === bookNumber) ?? null
    : null;

export interface BookChapterVerseState {
  selectedBook: NavigableBook | null;
  selectedChapter?: Chapter;
  availableVerses?: Verse[];
  availableChapters?: Chapter[];
};

const computeAvailableChaptersAndVersesFromNavigableBooksAndPosition = (availableBooks: NavigableBook[], currentPosition: BCVWP): BookChapterVerseState => {
  const selectedBook = findBookInNavigableBooksByBookNumber(availableBooks, currentPosition.book);

  const availableChapters = selectedBook?.chapters;

  const selectedChapter = availableChapters?.find(
    (chapter) => chapter.reference === currentPosition?.chapter);

  const availableVerses = selectedChapter ? availableChapters?.find(
    (chapter) => chapter.reference === selectedChapter?.reference
  )?.verses : undefined;

  return {
    selectedBook,
    availableChapters,
    selectedChapter,
    availableVerses
  };
}

export const findPreviousNavigableVerse = (availableBooks: NavigableBook[], availableChapters?: Chapter[], availableVerses?: Verse[], currentPosition?: BCVWP): BCVWP|null => {
  if (
    !availableBooks ||
    !availableChapters ||
    !availableVerses ||
    !currentPosition ||
    !currentPosition?.hasFields(
      BCVWPField.Book,
      BCVWPField.Chapter,
      BCVWPField.Verse
    )
  ) {
    return null;
  }

  const selectedVerseIndex = availableVerses.findIndex(
    (verse) => verse.reference === currentPosition?.verse
  );
  if (selectedVerseIndex < 0) {
    return null;
  }
  if (selectedVerseIndex < availableVerses.length - 1) {
    // if not the last verse in the chapter
    return new BCVWP(
      currentPosition?.book,
      currentPosition?.chapter,
      availableVerses[selectedVerseIndex + 1].reference
    );
  }
  // must go to next chapter
  const selectedChapterIndex = availableChapters.findIndex(
    (chapter) => chapter.reference === currentPosition?.chapter
  );
  if (selectedChapterIndex < 0) {
    return null;
  }
  if (selectedChapterIndex < availableChapters.length - 1) {
    // if not the last chapter in the book
    const chapter = availableChapters[selectedChapterIndex + 1]; // go forward one chapter
    return new BCVWP(
      currentPosition.book,
      chapter.reference,
      chapter.verses[0].reference
    );
  }
  const selectedBookIndex = availableBooks.findIndex(
    (book) => book.BookNumber === currentPosition?.book
  );
  if (selectedBookIndex < 0) {
    return null;
  }
  if (selectedBookIndex < availableBooks.length - 1) {
    // if not the last book
    const book = availableBooks[selectedBookIndex + 1]; // go back one book
    const chapter = book.chapters[0];
    const verse = chapter?.verses[0];
    return new BCVWP(book.BookNumber, chapter?.reference, verse?.reference);
  }
  return null;
}

export const findNextNavigableVerse = (availableBooks?: NavigableBook[], availableChapters?: Chapter[], availableVerses?: Verse[], currentPosition?: BCVWP): BCVWP|null => {
  if (
    !availableBooks ||
    !availableChapters ||
    !availableVerses ||
    !currentPosition ||
    !currentPosition?.hasFields(
      BCVWPField.Book,
      BCVWPField.Chapter,
      BCVWPField.Verse
    )
  ) {
    return null;
  }
  const selectedVerseIndex = availableVerses.findIndex(
    (verse) => verse.reference === currentPosition?.verse
  );
  if (selectedVerseIndex < 0) {
    return null;
  }
  if (selectedVerseIndex < availableVerses.length - 1) {
    // if not the last verse in the chapter
    return new BCVWP(
      currentPosition?.book,
      currentPosition?.chapter,
      availableVerses[selectedVerseIndex + 1].reference
    );
  }
  // must go to next chapter
  const selectedChapterIndex = availableChapters.findIndex(
    (chapter) => chapter.reference === currentPosition?.chapter
  );
  if (selectedChapterIndex < 0) {
    return null;
  }
  if (selectedChapterIndex < availableChapters.length - 1) {
    // if not the last chapter in the book
    const chapter = availableChapters[selectedChapterIndex + 1]; // go forward one chapter
    return new BCVWP(
      currentPosition.book,
      chapter.reference,
      chapter.verses[0].reference
    );
  }
  const selectedBookIndex = availableBooks.findIndex(
    (book) => book.BookNumber === currentPosition?.book
  );
  if (selectedBookIndex < 0) {
    return null;
  }
  if (selectedBookIndex < availableBooks.length - 1) {
    // if not the last book
    const book = availableBooks[selectedBookIndex + 1]; // go back one book
    const chapter = book.chapters[0];
    const verse = chapter?.verses[0];
    return new BCVWP(book.BookNumber, chapter?.reference, verse?.reference);
  }
  return null;
}
