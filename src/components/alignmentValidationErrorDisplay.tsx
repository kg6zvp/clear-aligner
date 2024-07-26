import { Typography } from '@mui/material';
import { AlignmentFileCheckResults } from '../helpers/alignmentFile';

export interface AlignmentErrorDisplayProps {
  checkResults?: AlignmentFileCheckResults;
}

/**
 * Displays errors resulting from Zod's safeParse call
 * @param errors optional errors to be displayed
 */
export const AlignmentValidationErrorDisplay = ({ checkResults }: AlignmentErrorDisplayProps) => {
  const errorMessages = checkResults?.errorMessages;
  return <>
    {errorMessages &&
      <Typography
        component={'span'}
        color={'error'}>
        <ul>
          {errorMessages.map((errorMessage, errorIdx) => {
            const errorKey = `error-${errorIdx}`;
            return <li key={errorKey}>{errorMessage}</li>;
          })}
        </ul>
        {errorMessages.length < checkResults?.rejectedLinks
          && `+ ${(checkResults?.rejectedLinks - errorMessages.length).toLocaleString()} more validation error(s)`}
      </Typography>}
  </>;
};
