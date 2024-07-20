import { styled } from '@mui/material/styles';
import { Button, useTheme } from '@mui/material';
import { ThemeMode } from '../features/themed';

/**
 * This file contains customized status Button components
 * Created, Approved, Rejected, NeedsReview
 */


export const CreatedButtonLight = styled(Button)(({ theme }) => ({
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

export const CreatedButtonDark = styled(Button)(({ theme }) => ({
  '&:disabled': {
    color: '#FFFFFF26', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:enabled': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:hover': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#FFFFFF08',
  },
  '&.MuiButton-contained': {
    color: '#FFFFFF', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: theme.palette.primary.main,
  }
})) as typeof Button;

export const ApprovedButtonLight = styled(Button)(({ theme }) => ({
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
    backgroundColor: theme.palette.success.main,
  }
})) as typeof Button;

export const ApprovedButtonDark = styled(Button)(({ theme }) => ({
  '&:disabled': {
    color: '#FFFFFF26', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:enabled': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:hover': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#FFFFFF08',
  },
  '&.MuiButton-contained': {
    color: '#FFFFFF', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: theme.palette.success.main,
  }
})) as typeof Button;

export const RejectedButtonLight = styled(Button)(({ theme }) => ({
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
    backgroundColor: theme.palette.error.main,
  }
})) as typeof Button;

export const RejectedButtonDark = styled(Button)(({ theme }) => ({
  '&:disabled': {
    color: '#FFFFFF26', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:enabled': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:hover': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#FFFFFF08',
  },
  '&.MuiButton-contained': {
    color: '#FFFFFF', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: theme.palette.error.main,
  }
})) as typeof Button;

export const NeedsReviewButtonLight = styled(Button)(({ theme }) => ({
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
    backgroundColor: theme.palette.warning.main,
  }
})) as typeof Button;

export const NeedsReviewButtonDark = styled(Button)(({ theme }) => ({
  '&:disabled': {
    color: '#FFFFFF26', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:enabled': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#00000000',
  },
  '&:hover': {
    color: '#FFFFFF46', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: '#FFFFFF08',
  },
  '&.MuiButton-contained': {
    color: '#FFFFFF', //icon color
    stroke: '#FFFFFF0C',
    backgroundColor: theme.palette.warning.main,
  }
})) as typeof Button;

