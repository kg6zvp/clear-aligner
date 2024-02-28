import React from 'react';
import { AlignmentEditor } from '../alignmentEditor/alignmentEditor';

interface WorkbenchDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const WorkbenchDialog: React.FC<WorkbenchDialogProps> = ({open, setOpen}) => {

  return (
    <AlignmentEditor showNavigation={false} />
  )
}

export default WorkbenchDialog;
