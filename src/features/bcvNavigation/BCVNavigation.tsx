import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  IconButton,
  SxProps,
  TextField,
  Theme,
  Tooltip,
} from '@mui/material';
import { Word } from '../../structs';
import { BookInfo } from '../../workbench/books';
import { Box } from '@mui/system';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { BCVWPField } from 'features/bcvwp/BCVWPSupport';
import BCVWP from '../bcvwp/BCVWPSupport';
import { BCVDisplay } from '../bcvwp/BCVDisplay';

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

const getReferenceListFromWords = (words: Word[]): NavigableBook[] =>
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
                reference: ref.verse ?? 0,
              },
            ],
          },
        ],
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
          book,
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
          book,
        ];
      }
      return accumulator;
    }, [] as NavigableBook[])
    .sort((a, b): number => a.BookNumber - b.BookNumber);

const findBookInNavigableBooksByBookNumber = (
  navigableBooks: NavigableBook[],
  bookNumber?: number
): NavigableBook | null =>
  bookNumber
    ? navigableBooks.find((book) => book.BookNumber === bookNumber) ?? null
    : null;

export interface BCVNavigationProps {
  sx?: SxProps<Theme>;
  disabled?: boolean;
  horizontal?: boolean;
  words?: Word[];
  currentPosition?: BCVWP;
  onNavigate?: (selection: BCVWP) => void;
}

const ICON_BTN_VERT_MARGIN = '.5em';

/**
 * BCVNavigation component for use in React
 * @param props.words list of references available for navigation
 * @param props.currentPosition optional prop to specify current position
 * @param props.onNavigate callback function which will receive division, book, chapter and verse coordinates
 */
const BCVNavigation = ({
  sx,
  disabled,
  words,
  currentPosition,
  onNavigate,
  horizontal,
}: BCVNavigationProps) => {
  const [availableBooks, setAvailableBooks] = useState([] as NavigableBook[]);
  const [selectedBook, setSelectedBook] = useState(
    null as NavigableBook | null
  );
  const [selectedChapter, setSelectedChapter] = useState(
    null as Chapter | null
  );
  const [selectedVerse, setSelectedVerse] = useState(null as Verse | null);

  const getBooksWithNavigationInfo = async (words: Word[]) => {
    const referenceList = getReferenceListFromWords(words);
    setAvailableBooks(referenceList ?? []);
  };

  /**
   * asynchronously initialize the book->chapter->verse listings from the given word list
   */
  useEffect(() => {
    void getBooksWithNavigationInfo(words ?? []);
  }, [words]);

  /**
   * when the book->chapter->verse listings are ready and there is a value for "currentPosition.book", set the selected book based on it
   */
  useEffect(() => {
    setSelectedBook(
      findBookInNavigableBooksByBookNumber(
        availableBooks,
        currentPosition?.book
      )
    );
  }, [availableBooks, currentPosition, setSelectedBook]);

  const availableChapters = useMemo(
    () => (selectedBook ? selectedBook?.chapters : []),
    [selectedBook]
  );

  /**
   * this is to ensure that the chapter selection is properly set after the available words have been loaded into navigable books
   */
  useEffect(() => {
    setSelectedChapter(
      availableChapters?.find(
        (chapter) => chapter.reference === currentPosition?.chapter
      ) ?? null
    );
  }, [availableChapters, currentPosition, setSelectedChapter]);

  const availableVerses = useMemo(
    () =>
      availableChapters && selectedChapter
        ? availableChapters.find(
            (chapter) => chapter.reference === selectedChapter.reference
          )?.verses
        : [],
    [availableChapters, selectedChapter]
  );

  /**
   * this is to ensure that the verse selection is properly set after the available words have been loaded into navigable books
   */
  useEffect(() => {
    setSelectedVerse(
      availableVerses?.find(
        (verse) => verse.reference === currentPosition?.verse
      ) ?? null
    );
  }, [availableVerses, currentPosition?.verse, setSelectedVerse]);

  const handleSetBook = (book: NavigableBook | null) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerse(null);
  };

  const handleSetChapter = (chapter: Chapter | null) => {
    setSelectedChapter(chapter);
    setSelectedVerse(null);
  };

  const previousNavigableVerse: BCVWP | null = useMemo(() => {
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
    if (selectedVerseIndex > 0) {
      return new BCVWP(
        currentPosition.book,
        currentPosition.chapter,
        availableVerses[selectedVerseIndex - 1].reference
      );
    }
    // must go back to end of previous chapter
    const selectedChapterIndex = availableChapters.findIndex(
      (chapter) => chapter.reference === currentPosition?.chapter
    );
    if (selectedChapterIndex < 0) {
      return null;
    }
    if (selectedChapterIndex > 0) {
      const chapter = availableChapters[selectedChapterIndex - 1]; // go back one chapter
      return new BCVWP(
        currentPosition.book,
        chapter.reference,
        chapter.verses.at(-1)?.reference
      );
    }
    const selectedBookIndex = availableBooks.findIndex(
      (book) => book.BookNumber === currentPosition?.book
    );
    if (selectedBookIndex < 0) {
      return null;
    }
    if (selectedBookIndex > 0) {
      const book = availableBooks[selectedBookIndex - 1]; // go back one book
      const chapter = book.chapters.at(-1);
      const verse = chapter?.verses.at(-1);
      return new BCVWP(book.BookNumber, chapter?.reference, verse?.reference);
    }
    return null;
  }, [currentPosition, availableBooks, availableChapters, availableVerses]);

  const navigateBack: (() => void) | null = useMemo(() => {
    if (!previousNavigableVerse) {
      return null;
    }
    return () => {
      if (!previousNavigableVerse || !onNavigate) {
        return;
      }
      onNavigate(previousNavigableVerse);
    };
  }, [previousNavigableVerse, onNavigate]);

  const backButton = useMemo(
    () => (
      <Tooltip
        title={
          previousNavigableVerse ? (
            <BCVDisplay currentPosition={previousNavigableVerse} />
          ) : (
            ''
          )
        }
      >
        <IconButton
          color={'primary'}
          sx={{ marginTop: ICON_BTN_VERT_MARGIN }}
          disabled={disabled || !navigateBack}
          onClick={navigateBack ?? undefined}
        >
          <ArrowBack />
        </IconButton>
      </Tooltip>
    ),
    [disabled, navigateBack, previousNavigableVerse]
  );

  const nextNavigableVerse: BCVWP | null = useMemo(() => {
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
  }, [currentPosition, availableBooks, availableChapters, availableVerses]);

  const navigateForward: (() => void) | null = useMemo(() => {
    if (!nextNavigableVerse) {
      return null;
    }
    return () => {
      if (!nextNavigableVerse || !onNavigate) {
        return;
      }
      onNavigate(nextNavigableVerse);
    };
  }, [nextNavigableVerse, onNavigate]);

  const forwardButton = useMemo(
    () => (
      <Tooltip
        title={
          nextNavigableVerse ? (
            <BCVDisplay currentPosition={nextNavigableVerse} />
          ) : (
            ''
          )
        }
      >
        <IconButton
          color={'primary'}
          sx={{ marginTop: ICON_BTN_VERT_MARGIN }}
          disabled={disabled || !navigateForward}
          onClick={navigateForward ?? undefined}
        >
          <ArrowForward />
        </IconButton>
      </Tooltip>
    ),
    [disabled, navigateForward, nextNavigableVerse]
  );

  const verseSelection = useMemo(
    () => (
      <Autocomplete
        disabled={disabled || !availableVerses}
        disablePortal
        id="verse-selection"
        size="small"
        sx={{
          display: 'inline-flex',
          width: horizontal ? '6em' : '100%',
        }}
        getOptionLabel={(option) =>
          option?.reference ? String(option.reference) : ''
        }
        options={availableVerses ?? []}
        typeof={'select'}
        value={
          selectedVerse && (availableVerses?.length ?? 0) > 0
            ? selectedVerse
            : null
        }
        onChange={(_, value) => setSelectedVerse(value)}
        renderInput={(params) => (
          <TextField label={'Verse'} {...params} variant={'standard'} />
        )}
      />
    ),
    [disabled, availableVerses, selectedVerse, setSelectedVerse, horizontal]
  );

  const handleNavigation = useMemo(
    () => () =>
      onNavigate &&
      selectedBook &&
      selectedChapter &&
      selectedVerse &&
      onNavigate(
        new BCVWP(
          selectedBook.BookNumber,
          selectedChapter.reference,
          selectedVerse.reference
        )
      ),
    [selectedBook, selectedChapter, selectedVerse, onNavigate]
  );

  return (
    <Box
      sx={
        {
          ...(sx ?? ({} as SxProps<Theme>)),
          display: 'flex',
          flexFlow: horizontal ? 'row' : 'column',
          ...(horizontal
            ? {
                flexWrap: 'wrap',
                gap: '.50em',
              }
            : {
                alignItems: 'center',
              }),
        } as unknown as undefined /*cast to avoid material-ui bug*/
      }
      className={BCVNavigation.name}
    >
      {horizontal && backButton}
      <Autocomplete
        disabled={disabled}
        disablePortal
        id="book-selection"
        size="small"
        sx={{
          width: horizontal ? '12em' : '100%',
          display: 'inline-flex',
        }}
        options={availableBooks ?? ([] as NavigableBook[])}
        typeof={'select'}
        groupBy={(book: NavigableBook) => {
          if (book.BookNumber < 40) return 'Old Testament';
          if (book.BookNumber > 39 && book.BookNumber < 68)
            return 'New Testament';
          return 'Apocrypha';
        }}
        getOptionLabel={(option) => option.EnglishBookName}
        value={selectedBook}
        onChange={(_, value) => handleSetBook(value)}
        renderInput={(params) => (
          <TextField {...params} label={'Book'} variant={'standard'} />
        )}
      />
      <Autocomplete
        disabled={disabled}
        disablePortal
        size="small"
        sx={{
          width: horizontal ? '6em' : '100%',
          display: 'inline-flex',
        }}
        options={availableChapters}
        typeof={'select'}
        getOptionLabel={(option) => String(option.reference)}
        value={selectedChapter}
        onChange={(_, value) => handleSetChapter(value)}
        renderInput={(params) => (
          <TextField label={'Chapter'} {...params} variant={'standard'} />
        )}
      />
      {horizontal ? (
        <>
          {verseSelection}
          {forwardButton}
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
          }}
        >
          {backButton}
          {verseSelection}
          {forwardButton}
        </Box>
      )}
      <Button
        sx={{
          ...(horizontal ? { marginTop: '.85em' } : {}),
        }}
        variant={'text'}
        color={'primary'}
        disabled={
          disabled || !selectedBook || !selectedChapter || !selectedVerse
        }
        onClick={() => handleNavigation()}
      >
        Navigate
      </Button>
    </Box>
  );
};

export default BCVNavigation;
