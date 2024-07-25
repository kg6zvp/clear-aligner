import { ZodError, ZodIssue } from 'zod';
import { Typography } from '@mui/material';

export interface ZodErrorDisplayProps {
  fieldNameMapper?: (issue: ZodIssue) => string|undefined;
  errors?: ZodError<any>;
}

/**
 * Displays errors resulting from Zod's safeParse call
 * @param errors optional errors to be displayed
 */
export const ZodErrorDisplay = ({ fieldNameMapper, errors }: ZodErrorDisplayProps) => (
  <>
    {errors &&
      <Typography
        component={'span'}
        color={'error'} >
        <ul>
          {errors.issues
            .slice(0, 10)
            .filter((iss: ZodIssue) => !!iss.message)
            .map((issue: ZodIssue) => {
              const fieldPath = issue.path.join('.');
              const fieldMessage = fieldNameMapper?.(issue) ?? `'.${fieldPath}': ${issue.message.toLowerCase()}`;
              return (
                <li key={fieldPath}>{fieldMessage}</li>
              );
            })}
        </ul>
        {errors.issues.length > 10 && `+ ${errors.issues.length-10} more validation error(s)`}
      </Typography>}
  </>
);
