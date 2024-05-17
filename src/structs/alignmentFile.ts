import { LinkMetadata, LinkOriginSchema, LinkStatus, LinkStatusSchema } from './index';
import { z, ZodIssue } from 'zod';
import { ZodErrorDisplay } from '../components/zodErrorDisplay';

/**
 * Metadata saved in alignment json files
 */
export interface RecordMetadata extends LinkMetadata {
  id: string;
}

/**
 * Zod schema for {@link RecordMetadata}
 */
export const RecordMetadataSchema = z.object({
  id: z.string(),
  origin: LinkOriginSchema,
  status: LinkStatusSchema
}, {
  message: `meta object is required and must contain 'id', 'origin' and 'status'`
});

/**
 * Alignment link for reading from/writing to alignment json files
 */
export interface AlignmentRecord {
  meta: RecordMetadata;
  source: string[];
  target: string[];
}

/**
 * Zod validation message for the `sources` and `targets` arrays
 */
const wordsArrayRequiredMessage = 'array of BCVWP coordinates is required';
/**
 * Zod schema for {@link AlignmentRecord}
 */
export const AlignmentRecordSchema = z.object({
  meta: RecordMetadataSchema,
  source: z.array(z.string(), {
    message: wordsArrayRequiredMessage
  }),
  target: z.array(z.string(), {
    message: wordsArrayRequiredMessage
  })
});

/**
 * The model representation of the Alignment data file.
 */
export interface AlignmentFile {
  type: string;
  meta: {
    creator: string;
  };
  records: AlignmentRecord[];
}

/**
 * Zod schema for {@link AlignmentFile}
 */
export const AlignmentFileSchema = z.object({
  type: z.string().optional(),
  meta: z.object({
    creator: z.string().optional()
  }),
  records: z.array(AlignmentRecordSchema, {
    message: 'alignment must contain records'
  })
});

/**
 * Human-friendly validation error message generator for {@link ZodErrorDisplay}
 * component
 * @param issue {@link ZodIssue} to generate a message for
 * @return human-readable error message or {@link undefined}
 */
export const alignmentFileSchemaErrorMessageMapper = (issue: ZodIssue) => {
  if (issue.path[0] === 'records') {
    if (issue.path[2] === 'meta') {
      if (issue.path.length > 3) {
        if (issue.path[3] === 'status') {
          return `Record ${Number(issue.path[1]) + 1} missing required attribute in meta field 'origin': must be one of [${Object.values(LinkStatus).join(', ')}]`;
        } else if (issue.path[3] === 'origin') {
            return `Record ${Number(issue.path[1]) + 1} missing required attribute in meta field 'status': must be of type string`;
        } else if (!issue.path[3]) {
          return `Record ${Number(issue.path[1]) + 1} missing required attribute in meta field ${issue.path[3]}`;
        } else {
          return issue.path.join('.');
        }
      } else {
        return `Record ${Number(issue.path[1]) + 1} missing required attribute '${issue.path[2]}': ${issue.message}`;
      }
    } else if (issue.path[2] === 'source' || issue.path[2] === 'target') {
      return `Record ${Number(issue.path[1]) + 1} missing required attribute '${issue.path[2]}': ${issue.message}`;
    }
  } else if (issue.path.length < 2) {
    return `alignment json requires field '${issue.path[0]}'`;
  }//*/
  return undefined;
}
