import React, {useEffect, useMemo, useState} from 'react';
import {Autocomplete, TextField} from "@mui/material";
import {Word} from "../structs";
import BCVWP, {BCVWPField, parseFromString} from "../BCVWP/BCVWPSupport";
import {BookInfo} from "../workbench/books";

export interface Verse {
  reference: number;
}

export interface Chapter {
  reference: number;
  verses: Verse[];
}

interface NavigableBook extends BookInfo {
  index: number
  chapters: Chapter[];
}

const getReferenceListFromWords = (words: Word[]): NavigableBook[] =>
  words
    .map(word => parseFromString(word.id))
    .filter(ref => ref.hasFields(BCVWPField.Book, BCVWPField.Chapter, BCVWPField.Verse, BCVWPField.Word))
    .map((ref): NavigableBook => ({
      index: ref.book!-1,
      ...ref.getBookInfo()!,
      chapters: [{
        reference: ref.chapter ?? 0,
        verses: [{
          reference: ref.verse ?? 0
        }]
      }]
    }))
    //.filter(ref => ref.index !== 0 && ref.title !== '' && ref.chapters.length > 0 && ref.chapters[0].reference !== 0 && ref.chapters[0].verses.length > 0 && ref.chapters[0].verses[0].reference !== 0)
    /**
     * merge the individual verse references into books with lists of available chapters and verses
     */
    .reduce((accumulator, currentReference): NavigableBook[] => {
      const book = accumulator.find(book => book.index === currentReference.index);
      if (!book) {
        // add book
        return [...accumulator, currentReference];
      }
      const currentChapter = currentReference.chapters[0];
      const chapter = book.chapters.find(chapter => chapter.reference === currentChapter.reference);
      if (!chapter) {
        // add chapter
        book.chapters = [...book.chapters, currentChapter]
          .sort((a, b): number => a.reference - b.reference);
        return [...accumulator.filter(b => b.index !== currentReference.index), book];
      }
      const currentVerse = currentChapter.verses[0];
      const verse = chapter.verses.find(verse => verse.reference === currentVerse.reference);
      if (!verse) {
        // add verse
        chapter.verses = [...chapter.verses, currentVerse]
          .sort((a, b): number => a.reference - b.reference);
        return [...accumulator.filter(b => b.index !== currentReference.index), book];
      }
      return accumulator;
    }, [] as NavigableBook[])
    .sort((a, b): number => a.index - b.index);

/**
 * use 0 as a non-value since everything is 1-indexed
 */
const NO_VALUE = 0;

const findBookInNavigableBooksByBookNumber = (navigableBooks: NavigableBook[], bookNumber?: number): NavigableBook | null | undefined =>
  bookNumber ? navigableBooks.find(book => book.BookNumber === bookNumber) : null;

export interface BCVNavigationProps {
  horizontal?: boolean;
  words?: Word[];
  currentPosition?: BCVWP;
  onNavigate?: (selection: BCVWP) => void;
}

/**
 * BCVNavigation component for use in React
 * @param props.words list of references available for navigation
 * @param props.currentPosition optional prop to specify current position
 * @param props.onNavigate callback function which will receive division, book, chapter and verse coordinates
 */
const BCVNavigation = ({words, currentPosition, onNavigate, horizontal}: BCVNavigationProps) => {
  const [booksWithNavigationInfo, setBooksWithNavigationInfo] = useState([] as NavigableBook[]);
  const [selectedBook, setSelectedBook] = useState(null as NavigableBook|null|undefined);
  const [selectedChapter, setSelectedChapter] = useState(currentPosition?.chapter ?? NO_VALUE);
  const [selectedVerse, setSelectedVerse] = useState(currentPosition?.verse ?? NO_VALUE);

  const getBooksWithNavigationInfo = async (words: Word[]) => {
    const referenceList = getReferenceListFromWords(words);
    setBooksWithNavigationInfo(referenceList ?? []);
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
    setSelectedBook(findBookInNavigableBooksByBookNumber(booksWithNavigationInfo, currentPosition?.book));
  }, [booksWithNavigationInfo, currentPosition, setSelectedBook]);

  const availableChapters = useMemo(() =>
      selectedBook ? selectedBook?.chapters : undefined,
    [selectedBook]);

  const availableVerses = useMemo(() =>
      availableChapters && selectedChapter && selectedChapter !== NO_VALUE ? availableChapters.find(chapter => chapter.reference === selectedChapter)?.verses : undefined,
    [availableChapters, selectedChapter]);

  const handleSetBook = (book?: NavigableBook) => {
    setSelectedBook(book ?? null);
    setSelectedChapter(NO_VALUE);
    setSelectedVerse(NO_VALUE);
  };

  const handleSetChapter = (chapterIndex?: number) => {
    setSelectedChapter(chapterIndex ?? NO_VALUE);
    setSelectedVerse(NO_VALUE);
  };

  const handleNavigation = useMemo(() =>
    () => onNavigate && selectedBook && selectedChapter && selectedVerse && onNavigate(new BCVWP(selectedBook.BookNumber, selectedChapter, selectedVerse)),
    [selectedBook, selectedChapter, selectedVerse, onNavigate]);

  return <>
    <label>
      {'Book '}
      <Autocomplete
        disablePortal
        id='book-selection'
        size='small'
        sx={{
          width: '12em',
          display: 'inline-flex'
        }}
        options={booksWithNavigationInfo}
        typeof={'select'}
        groupBy={(book: NavigableBook) => {
          if (book.BookNumber < 40) return 'Old Testament';
          if (book.BookNumber > 39 && book.BookNumber < 68) return 'New Testament';
          return 'Apocrypha';
        }}
        getOptionLabel={(option) => option.EnglishBookName}
        value={selectedBook}
        onChange={(_, value) => handleSetBook(value ?? undefined)}
        renderInput={(params) => <TextField {...params} variant={'standard'}/>}/>
    </label>
    {!horizontal && <br/>}
    <label>
      {'Chapter '}
      <select
        disabled={!selectedBook}
        value={selectedChapter}
        onChange={(e) =>
          handleSetChapter(e.target.value ? Number(e.target.value) : undefined as number | undefined)}>
        <option
          key={NO_VALUE}
          value={NO_VALUE}>
          Select a chapter
        </option>
        {availableChapters?.map((c) =>
          <option
            key={c.reference}
            value={c.reference}>
            {c.reference}
          </option>
        )}
      </select>
    </label>
    {!horizontal && <br/>}
    <label>
      {'Verse '}
      <select
        disabled={!selectedChapter}
        value={selectedVerse}
        onChange={(e) => setSelectedVerse(e.target.value ? Number(e.target.value) : NO_VALUE as number)}>
        <option
          key={NO_VALUE}
          value={NO_VALUE}>
          Select a verse
        </option>
        {availableVerses?.map((verse) =>
          (<option
            key={verse.reference}
            value={verse.reference}>
            {verse.reference}
          </option>))}
      </select>
    </label>
    {!horizontal && <br/>}
    <button
      disabled={!selectedBook || !selectedChapter || !selectedVerse}
      onClick={() => handleNavigation()}>
      Go
    </button>
  </>;
}

export default BCVNavigation;
