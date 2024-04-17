/**
 * This file contains the BCVDisplay component
 * which is a utility component that gets used throughout the UI
 */

import BCVWP from './BCVWPSupport';

export interface BCVDisplayProps {
  currentPosition?: BCVWP | null;
}

/**
 * builds a human readable string of a reference for display, supports truncated references (ie: Ezekiel 27 as opposed to Ezekiel 27:4)
 * @param currentPosition the current position, optional, will return empty JSX if not given
 * @constructor
 */
export const BCVDisplay = ({ currentPosition }: BCVDisplayProps) => {
  const bookInfo = currentPosition?.getBookInfo();
  const chapter = currentPosition?.chapter;
  const verse = currentPosition?.verse;
  return (
    <>
      {currentPosition &&
        `${bookInfo?.EnglishBookName}${
          chapter && chapter > 0
            ? ` ${chapter}${verse && verse > 0 ? `:${verse}` : ''}`
            : ''
        }`}
    </>
  );
};
