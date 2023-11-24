import React, {useMemo, useState} from 'react';
import {Autocomplete, TextField} from "@mui/material";
import {Corpus} from "../structs";
import BCVWP, {parseFromString} from "../BCVWP/BCVWPSupport";
import BCVWPSupport from "../BCVWP/BCVWPSupport";
import {BOOK_LIST, findBookByIndex} from "../BCVWP/BookLookup";

export interface Verse {
    reference: number;
}

export interface Chapter {
    reference: number;
    verses: Verse[];
}

export interface Book {
    title: string;
    chapters: Chapter[];
}

interface NavigableBook extends Book {
    /**
     * 1-based index within the division
     */
    index: number;
}

export interface BCVNavigationProps {
    horizontal?: boolean;
    corpora: Corpus[];
    currentPosition?: BCVWP;
    onNavigate?: (selection: BCVWP) => void;
}

const getReferenceListFromCorpora = (corpora: Corpus[]): NavigableBook[] =>
    corpora
        .map(corpus => parseFromString(corpus.id))
        .map((ref): NavigableBook => ({
            index: ref.book ?? 0,
            title: ref.getBookInfo()?.name ?? '',
            chapters: [{
                reference: ref.chapter ?? 0,
                verses: [{
                    reference: ref.verse ?? 0
                }]
            }]
        }))
        .filter(ref => ref.index !== 0 && ref.title !== '' && ref.chapters.length > 0 && ref.chapters[0].reference !== 0 && ref.chapters[0].verses.length > 0 && ref.chapters[0].verses[0].reference !== 0)
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
            const chapter = book.chapters.find(chapter => chapter.reference == currentChapter.reference);
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

const findBookInNavigableBooksByIndex = (navigableBooks: NavigableBook[], index?: number): NavigableBook|null|undefined =>
    index ? navigableBooks.find(book => book.index === index) : null;

/**
 * BCVNavigation component for use in React
 * @param props.corpora list of references available for navigation
 * @param props.currentPosition optional prop to specify current position
 * @param props.onNavigate callback function which will receive division, book, chapter and verse coordinates
 */
const BCVNavigation = ({ corpora, currentPosition, onNavigate, horizontal } : BCVNavigationProps) => {
    const booksWithNavigationInfo = useMemo(() =>
        getReferenceListFromCorpora(corpora), [corpora]);
    const [selectedBook, setSelectedBook] = useState(findBookInNavigableBooksByIndex(booksWithNavigationInfo, currentPosition?.book));
    const [selectedChapter, setSelectedChapter] = useState(currentPosition?.chapter ?? NO_VALUE);
    const [selectedVerse, setSelectedVerse] = useState(currentPosition?.verse ?? NO_VALUE);

    console.log('selectedChapter', selectedChapter);
    console.log('selectedVerse', selectedVerse);
    const availableChapters = useMemo(() =>
        selectedBook ? selectedBook?.chapters : undefined,
        [booksWithNavigationInfo, selectedBook]);

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
        () => onNavigate && selectedBook && selectedChapter && selectedVerse && onNavigate(new BCVWP(selectedBook.index, selectedChapter, selectedVerse)), [selectedBook, selectedChapter, selectedVerse]);

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
                    if (book.index < 40) return 'Old Testament';
                    if (book.index > 39 && book.index < 68) return 'New Testament';
                    return 'Apocrypha';
                }}
                getOptionLabel={(option) => option.title}
                value={selectedBook}
                onChange={(_, value) => handleSetBook(value ?? undefined)}
                renderInput={(params) => <TextField {...params} variant={'standard'} />} />
        </label>
        {!horizontal && <br/>}
        <label>
            {'Chapter '}
            <select
                disabled={!selectedBook}
                value={selectedChapter}
                onChange={(e) =>
                    handleSetChapter(e.target.value ? Number(e.target.value) : undefined as number|undefined)} >
                <option
                    key={NO_VALUE}
                    value={NO_VALUE} >
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
                onChange={(e) => setSelectedVerse(e.target.value ? Number(e.target.value) : NO_VALUE as number)} >
                <option
                    key={NO_VALUE}
                    value={NO_VALUE} >
                    Select a verse
                </option>
                {availableVerses?.map((verse) =>
                        (<option
                            key={verse.reference}
                            value={verse.reference} >
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