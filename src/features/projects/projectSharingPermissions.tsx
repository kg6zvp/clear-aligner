import {
  Autocomplete,
  Box,
  Button, Grid,
  Paper,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, TextField,
  Theme
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useUsersFromServer } from '../../hooks/userInfoHooks';

interface UserEntryRowProps {
  disabled?: boolean;
  email: string;
  deleteActionCallback: () => void;
}

const UserEntryRow = ({
  disabled,
  email,
  deleteActionCallback
                      }: UserEntryRowProps) => {
  return (<TableRow>
    <TableCell>
      {email}
    </TableCell>
    <TableCell>
      <Button disabled={disabled} variant={'outlined'} color={'error'} onClick={deleteActionCallback}>Delete</Button>
    </TableCell>
  </TableRow>);
}

interface UserEmailAutocompleteProps {
  disabled?: boolean;
  onSubmit: (email: string) => void;
}

const UserEmailAutocomplete = ({
                                 disabled,
                                 onSubmit
}: UserEmailAutocompleteProps) => {

  const usersOnServer = useUsersFromServer();
  const [ draftEmail, setDraftEmail ] = useState<string>('');

  return (<>
    <Grid
      sx={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        marginTop: '8px',
        marginBottom: '8px'
      }} >
      <Autocomplete
        disabled={disabled}
        sx={{
          flexGrow: 1,
          marginTop: '2px',
          marginRight: '8px'
        }}
        freeSolo
        clearOnBlur
        value={draftEmail}
        options={!!usersOnServer ? usersOnServer : ['Loading...']}
        onChange={(e, v, r) => setDraftEmail(v ?? '')}
        renderInput={(params) => <TextField {...params} label={'Add User'} />}
      />
      <Button variant={'contained'} onClick={() => {
        onSubmit(draftEmail);
        setDraftEmail('');
      }}>Add</Button>
    </Grid>
  </>);
}

/**
 * props for project permissions component
 */
export interface ProjectSharingPermissionsProps {
  sx?: SxProps<Theme>;
  disabled?: boolean;
  members: string[];
  onMembersUpdated: (membersList: string[]) => void;
}

/**
 * Project permissions editor
 */
const ProjectSharingPermissions = ({
  sx,
  disabled,
  members,
  onMembersUpdated
                            }: ProjectSharingPermissionsProps) => {

  const handleAdd = useCallback((member: string) => {
    if (members.includes(member)) return;
    onMembersUpdated([ ...members, member ]);
  }, [ members, onMembersUpdated ]);
  const handleRemoveMember = useCallback((idx: number) => {
    onMembersUpdated(members.filter((v, i) => i !== idx));
  }, [ members, onMembersUpdated ]);

  return (<Box sx={{
    margin: '4px',
    display: 'flex',
    flexDirection: 'column',
    ...sx
  }}>
    <UserEmailAutocomplete
      disabled={disabled}
      onSubmit={handleAdd} />
    <TableContainer
      sx={{
        marginTop: '8px',
        marginBottom: '8px',
        flexGrow: 1
      }}
      component={Paper}>
      <Table
        sx={{
          width: '100%',
          height: '100% !important'
        }}>
        <TableHead>
          <TableRow>
            <TableCell>User Email</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members?.map((email, idx) => (
            <UserEntryRow
              key={idx}
              disabled={disabled}
              email={email}
              deleteActionCallback={() => handleRemoveMember(idx)} />))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>);
}

export default ProjectSharingPermissions;
