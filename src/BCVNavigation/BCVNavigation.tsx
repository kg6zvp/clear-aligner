import React, {useMemo, useState} from 'react';
import {Autocomplete, TextField} from "@mui/material";

export interface Verse {
    reference: string; // supports verses with letter references
}

export interface Chapter {
    reference: number;
    verses: Verse[]|number;
}

export interface Book {
    title: string;
    chapters: Chapter[];
}

interface NavigableBook extends Book {
    /**
     * old testament, new testament, apocrypha, etc.
     */
    division: string;
    /**
     * 1-based index within the division
     */
    index: number;
}

/**
 * encapsulates a
 */
export interface Division {
    title: string;
    books: Book[];
}

/**
 * Encapsulates the navigation elements
 */
export interface Navigation {
    /**
     * Old Testament, New Testament, Apocrypha, etc.
     */
    division?: string;
    /**
     * book, 1-indexed
     */
    book?: number;
    /**
     * chapter number
     */
    chapter?: number;
    /**
     * verse number
     */
    verse?: number;
}

export interface BCVNavigationProps {
    divisions: Division[];
    currentPosition?: Navigation;
    onNavigate?: (selection: Navigation) => undefined;
}

const divisionsToBooksWithDivisionTitleAndIndex = (divisions: Division[]): NavigableBook[] => {
    return divisions?.flatMap(division => ([
        ...division.books.map((book, index) => ({
            division: division.title,
            title: book.title,
            index: index + 1, //1-based index
            chapters: book.chapters
        } as NavigableBook))
    ])) as NavigableBook[] ?? [];
};

const findBookInNavigableBooks = (booksWithNavigationInfo: NavigableBook[], divisionTitle?: string, bookIndex?: number): NavigableBook|undefined =>
    booksWithNavigationInfo?.find(navigableBook => navigableBook.division && navigableBook.division === divisionTitle
                                                                                && navigableBook.index && navigableBook.index === bookIndex);

/**
 * BCVNavigation component for use in React
 * @param divisions passed as a prop because different translations sometimes differ in even the number of chapters or verses in the books or may include apocryphal books for scholarly analysis
 * @param currentPosition optional prop to specify current position
 * @param onNavigate callback function which will receive division, book, chapter and verse coordinates
 */
const BCVNavigation = ({ divisions, currentPosition, onNavigate } : BCVNavigationProps) => {
    const booksWithNavigationInfo = useMemo(() =>
        divisionsToBooksWithDivisionTitleAndIndex(divisions), [divisions]);
    const [selectedBook, setSelectedBook] = useState(findBookInNavigableBooks(booksWithNavigationInfo, currentPosition?.division, currentPosition?.book) as NavigableBook|null);
    const [selectedChapter, setSelectedChapter] = useState(currentPosition?.chapter as number|undefined|null);
    const [selectedVerse, setSelectedVerse] = useState(currentPosition?.verse as number|undefined|null);

    const availableChapters = useMemo(() =>
        selectedBook ? selectedBook?.chapters : undefined,
        [divisions, selectedBook]);

    const availableVerses = useMemo(() =>
        availableChapters && selectedChapter && selectedChapter >= 1 ? availableChapters[selectedChapter-1]?.verses : undefined,
        [availableChapters, selectedChapter]);

    const handleSetBook = (book?: NavigableBook) => {
        setSelectedBook(book as NavigableBook|null);
        setSelectedChapter(0);
        setSelectedVerse(0);
    };

    const handleSetChapter = (chapterIndex?: number) => {
        setSelectedChapter(chapterIndex);
        setSelectedVerse(0);
    };

    const renderVerseSelection = (verses?: Verse[] | number) => {
        if (!verses) return <></>;
        if (Array.isArray(verses)) { // Verse[]
            return (verses as Verse[]).map((verse, i) =>
                (<option
                    key={i}
                    value={verse.reference} >
                    {verse.reference}
                </option>));
        }
        const keys: number[] = [];
        for (let i = 1; i <= (verses as number); ++i) {
            keys.push(i);
        }
        return (keys.map(v =>
            (<option
                key={v}
                value={v}>
                {v}
            </option>)));
    };

    const handleNavigation = useMemo(() =>
        () => onNavigate && selectedBook && selectedChapter && selectedVerse && onNavigate({
            division: selectedBook.division,
            book: selectedBook.index,
            chapter: selectedChapter,
            verse: selectedVerse
        }), [selectedBook, selectedChapter, selectedVerse]);

    return <>
        <label>
            Book{' '}
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
                groupBy={(book: NavigableBook) => book?.division}
                getOptionLabel={(option) => option.title}
                value={selectedBook}
                onChange={(_, value) => handleSetBook(value ? value : undefined)}
                renderInput={(params) => <TextField {...params} variant={'standard'} />} />
        </label>
        <br/>
        <label>
            Chapter{' '}
            <select
                disabled={!selectedBook}
                value={selectedChapter ?? ''}
                onChange={(e) =>
                    handleSetChapter(e.target.value ? Number(e.target.value) : undefined as number|undefined)} >
                <option
                    value={0} >
                    Select a chapter
                </option>
                {availableChapters?.map((c, i) =>
                    <option
                        key={i+1}
                        value={i+1}>
                        {c.reference}
                    </option>
                )}
            </select>
        </label>
        <br/>
        <label>
            Verse{' '}
            <select
                disabled={!selectedChapter}
                value={selectedVerse ?? ''}
                onChange={(e) => {
                    setSelectedVerse(e.target.value ? Number(e.target.value) : undefined as number | undefined);
                }} >
                <option
                    value={undefined} >
                    Select a verse
                </option>
                {renderVerseSelection(availableVerses)}
            </select>
        </label>
        <br/>
        <button
            disabled={!selectedBook || !selectedChapter || !selectedVerse}
            onClick={() => handleNavigation()}>
            Go
        </button>
        </>;
}

export default BCVNavigation;