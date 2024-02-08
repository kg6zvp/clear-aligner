import { Link } from '../structs';

export enum AlignmentMode {
  CleanSlate = 'cleanSlate', // Default mode
  Select = 'select', // An existing link has been selected
  Edit = 'edit', // Editing a new or existing link
  PartialEdit = 'partialEdit', // Only one 'side' has been selected
}

export interface AlignmentState {
  inProgressLink: Link|null;
  mode: AlignmentMode;
}

