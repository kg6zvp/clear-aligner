/**
 * This file contains the SingleSelectStateButtonGroup component used in
 * ConcordanceView
 */
import { ButtonGroup, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import {
  ApprovedButtonDark,
  ApprovedButtonLight,
  CreatedButtonDark,
  CreatedButtonLight,
  NeedsReviewButtonDark,
  NeedsReviewButtonLight,
  RejectedButtonDark,
  RejectedButtonLight
} from './statusButtons';
import LinkIcon from '@mui/icons-material/Link';
import { Cancel, CheckCircle, Flag } from '@mui/icons-material';

/**
 * props for the SingleSelectStateButtonGroup
 */
export interface SingleSelectStateButtonGroupProps {
  value?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

/**
 * Display a group of state buttons, each with its own corresponding value
 * @param value currently chosen value, highlights the button with this value to indicate it is selected
 * @param onSelect callback when a button is clicked by the user
 * @param disabled (optional) flag to disable the buttons
 */
export const SingleSelectStateButtonGroup = ({
                                               value,
                                               onSelect,
                                               disabled = false
                                             }: SingleSelectStateButtonGroupProps) => {
  const theme = useTheme();

  if (theme.palette.mode === 'light') {
    return (
      <ButtonGroup fullWidth={true} disabled={disabled}>
        <Tooltip title={'Created'}>
          <CreatedButtonLight
            onClick={() => onSelect('created')}
            variant={value === 'created' ? 'contained' : undefined}
          >
            <LinkIcon />
          </CreatedButtonLight>
        </Tooltip>
        <Tooltip title={'Rejected'}>
          <RejectedButtonLight
            onClick={() => onSelect('rejected')}
            variant={value === 'rejected' ? 'contained' : undefined}
          >
            <Cancel />
          </RejectedButtonLight>
        </Tooltip>
        <Tooltip title={'Approved'}>
          <ApprovedButtonLight
            onClick={() => onSelect('approved')}
            variant={value === 'approved' ? 'contained' : undefined}
          >
            <CheckCircle />
          </ApprovedButtonLight>
        </Tooltip>
        <Tooltip title={'Needs Review'}>
          <NeedsReviewButtonLight
            onClick={() => onSelect('needsReview')}
            variant={value === 'needsReview' ? 'contained' : undefined}
          >
            <Flag />
          </NeedsReviewButtonLight>
        </Tooltip>
      </ButtonGroup>
    );
  } else {
    return (
      <ButtonGroup fullWidth={true} disabled={disabled}>
        <Tooltip title={'Created'}>
          <CreatedButtonDark
            onClick={() => onSelect('created')}
            variant={value === 'created' ? 'contained' : undefined}
          >
            <LinkIcon />
          </CreatedButtonDark>
        </Tooltip>
        <Tooltip title={'Rejected'}>
          <RejectedButtonDark
            onClick={() => onSelect('rejected')}
            variant={value === 'rejected' ? 'contained' : undefined}
          >
            <Cancel />
          </RejectedButtonDark>
        </Tooltip>
        <Tooltip title={'Approved'}>
          <ApprovedButtonDark
            onClick={() => onSelect('approved')}
            variant={value === 'approved' ? 'contained' : undefined}
          >
            <CheckCircle />
          </ApprovedButtonDark>
        </Tooltip>
        <Tooltip title={'Needs Review'}>
          <NeedsReviewButtonDark
            onClick={() => onSelect('needsReview')}
            variant={value === 'needsReview' ? 'contained' : undefined}
          >
            <Flag />
          </NeedsReviewButtonDark>
        </Tooltip>
      </ButtonGroup>
    );
  }
};
