import { ZodError, ZodIssue } from 'zod';
import { Typography } from '@mui/material';

export interface ZodErrorDisplayProps {
  errors?: ZodError<any>
}

/**
 * Displays errors resulting from Zod's safeParse call
 * @param errors optional errors to be displayed
 */
export const ZodErrorDisplay = ({ errors }: ZodErrorDisplayProps) => (
  <>
    {errors &&
      <Typography
        component={'span'}
        color={'red'} >
        <ul>
          {errors.issues
            .slice(0, 10)
            .filter((iss: ZodIssue) => !!iss.message)
            .map((issue: ZodIssue) => (
              <li key={issue.path.join('.')}>{`'.${issue.path.join('.')}': ${issue.message.toLowerCase()}`}</li>
            ))}
        </ul>
        {errors.issues.length > 10 && `+ ${errors.issues.length-10} more validation error(s)`}
      </Typography>}
  </>
);
