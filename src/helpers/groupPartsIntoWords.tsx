import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';
import { Word } from '../structs';

export const groupPartsIntoWords = <T extends Word>(words: T[]): T[][] =>
  words
    .reduce((accumulator, currentValue) => {
      const lastIndex = accumulator.length - 1;
      const currentValueRef: BCVWP = BCVWP.parseFromString(currentValue.id);

      if (
        accumulator[lastIndex]?.length === 0 ||
        (lastIndex >= 0 &&
          BCVWP.parseFromString(
            accumulator[lastIndex].at(-1)!.id
          ).matchesTruncated(currentValueRef, BCVWPField.Word))
      ) {
        // if text should be grouped in the last word
        accumulator[lastIndex].push(currentValue);
        return accumulator;
      } else {
        // new word
        accumulator.push([currentValue]);
        return accumulator;
      }
    }, [] as T[][])
    .filter((value) => value.length >= 1);
