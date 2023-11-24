import {BookInfo, findBookByIndex} from "./BookLookup";

class BCVWP {
    /**
     * 0-based index, from book list here: https://ubsicap.github.io/usfm/identification/books.html
     */
    book?: number;
    /**
     * 1-based index
     */
    chapter?: number;
    /**
     * 1-based index
     */
    verse?: number;
    /**
     * 1-based index
     */
    word?: number;
    /**
     * 1-based index
     */
    part?: number;

    constructor(book?: number, chapter?: number, verse?: number, word?: number, part?: number) {
        this.book = book;
        this.chapter = chapter;
        this.verse = verse;
        this.word = word;
        this.part = part;
    }

    toReferenceString(): string {
        const bookFormet = Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });
        const chapterFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
        const verseFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
        const wordFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
        return `${this.book ? bookFormet.format(this.book) : '  '}${this.chapter ? chapterFormat.format(this.chapter) : '   '}${this.verse ? verseFormat.format(this.verse) : '   '}${this.word ? wordFormat.format(this.word) : '   '}${this.part ?? 1}`;
    }

    getBookInfo(): BookInfo|undefined {
        return this.book ? findBookByIndex(this.book) : undefined;
    }
}

export const parseFromString = (reference: string): BCVWP => {
    if (!reference || reference.match(/\D/) || reference.length < 2) {
        throw new Error(`Illegal reference string given to parser: ${reference}`);
    }
    const bookString = reference.substring(0, 2);
    const chapterString = reference.length >= 5 ? reference.substring(2, 5) : undefined;
    const verseString = reference.length >= 8 ? reference.substring(5, 8) : undefined;
    const wordString = reference.length >= 11 ? reference.substring(8, 11) : undefined;
    const partString = reference.length >= 12 ? reference.substring(11, 12) : undefined;

    const bookNum = bookString ? Number(bookString) : undefined;
    const chapterNum = chapterString ? Number(chapterString) : undefined;
    const verseNum = verseString ? Number(verseString) : undefined;
    const wordNum = wordString ? Number(wordString) : undefined;
    const partNum = partString ? Number(partString) : undefined;

    return new BCVWP(bookNum, chapterNum, verseNum, wordNum, partNum);
};

export default BCVWP;