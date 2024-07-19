import { styled } from '@mui/material/styles';
import { Button, useTheme } from '@mui/material';
import { ThemeMode } from '../features/themed';

/**
 * This file contains customized status Button components
 * Created, Approved, Rejected, NeedsReview
 */


export const CreatedButton = styled(Button)(({ theme }) => ({

  '&:disabled': {
    color: '#00000061', //icon color
    stroke: '#0000001F',
    backgroundColor: '#FFFFFF',
  },
  '&:enabled': {
    color: '#0000008A', //icon color
    stroke: '#0000001F',
    backgroundColor: '#FFFFFF',
  },
  '&:hover': {
    color: '#0000008A', //icon color
    stroke: '#0000001F',
    backgroundColor: '#0000000A',
  },
  '&.MuiButton-contained': {
    color: '#FFFFFF', //icon color
    stroke: '#0000001F',
    backgroundColor: theme.palette.primary.main,
  }

})) as typeof Button;

export default CreatedButton;
