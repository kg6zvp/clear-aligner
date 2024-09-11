import {
  Button,
  Paper,
  Stack,
  SxProps,
  Table,
  TableBody, TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme
} from '@mui/material';
import { useProjectFromAppContextById } from '../../hooks/useProjectFromAppContextById';

interface UserEntryRowProps {
  email: string;
  deleteActionCallback: () => void;
}

const UserEntryRow = ({
  email,
  deleteActionCallback
                      }: UserEntryRowProps) => {
  return (<TableRow>
    <TableCell>
      {email}
    </TableCell>
    <TableCell>
      <Button onClick={deleteActionCallback}>Delete</Button>
    </TableCell>
  </TableRow>);
}

/**
 * props for project permissions component
 */
export interface ProjectSharingPermissionsProps {
  projectId: string;
  sx?: SxProps<Theme>;
}

/**
 * Project permissions editor
 */
const ProjectSharingPermissions = ({
  projectId,
  sx
                            }: ProjectSharingPermissionsProps) => {
  const project = useProjectFromAppContextById(projectId);
  return (<>
    <TableContainer component={Paper}>
      <Table sx={sx}>
        <TableHead>
          <TableRow>
            <TableCell>User Email</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {}
        </TableBody>
      </Table>
    </TableContainer>
  </>);
}

export default ProjectSharingPermissions;
