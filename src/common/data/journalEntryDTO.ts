import { ServerAlignmentLinkDTO } from './serverAlignmentLinkDTO';
import { Operation } from 'rfc6902';

export enum JournalEntryType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * journal entry
 */
export interface JournalEntryDTO {
  id?: string;
  linkId: string;
  type: JournalEntryType;
  date: Date;
  diff: ServerAlignmentLinkDTO | Operation[];
}

/**
 * convert a journal entry entity into a dto
 * @param je entity object
 */
export const mapJournalEntryEntityToJournalEntryDTO = (je: {
  id: string,
  linkId: string,
  type: JournalEntryType,
  date: Date,
  diff: string
}): JournalEntryDTO => {
  const parsed = JSON.parse(je.diff);
  return {
    ...je,
    diff: Array.isArray(parsed) ? parsed as Operation[] : parsed as ServerAlignmentLinkDTO
  };
};
