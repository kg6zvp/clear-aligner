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
          <span>
            <CreatedButtonLight
              onClick={() => onSelect('created')}
              variant={value === 'created' ? 'contained' : undefined}
            >
            <LinkIcon />
          </CreatedButtonLight>
          </span>
        </Tooltip>
        <Tooltip title={'Rejected'}>
          <span>
            <RejectedButtonLight
              onClick={() => onSelect('rejected')}
              variant={value === 'rejected' ? 'contained' : undefined}
            >
            <Cancel />
          </RejectedButtonLight>
          </span>
        </Tooltip>
        <Tooltip title={'Approved'}>
          <span>
            <ApprovedButtonLight
              onClick={() => onSelect('approved')}
              variant={value === 'approved' ? 'contained' : undefined}
            >
            <CheckCircle />
          </ApprovedButtonLight>
          </span>
        </Tooltip>
        <Tooltip title={'Needs Review'}>
          <span>
             <NeedsReviewButtonLight
               onClick={() => onSelect('needsReview')}
               variant={value === 'needsReview' ? 'contained' : undefined}
             >
            <Flag />
          </NeedsReviewButtonLight>
          </span>
        </Tooltip>
      </ButtonGroup>
    );
  } else {
    return (
      <ButtonGroup fullWidth={true} disabled={disabled}>
        <Tooltip title={'Created'}>
          <span>
             <CreatedButtonDark
               onClick={() => onSelect('created')}
               variant={value === 'created' ? 'contained' : undefined}
             >
            <LinkIcon />
          </CreatedButtonDark>
          </span>
        </Tooltip>
        <Tooltip title={'Rejected'}>
          <span>
            <RejectedButtonDark
              onClick={() => onSelect('rejected')}
              variant={value === 'rejected' ? 'contained' : undefined}
            >
            <Cancel />
          </RejectedButtonDark>
          </span>
        </Tooltip>
        <Tooltip title={'Approved'}>
          <span>
            <ApprovedButtonDark
              onClick={() => onSelect('approved')}
              variant={value === 'approved' ? 'contained' : undefined}
            >
            <CheckCircle />
          </ApprovedButtonDark>
          </span>
        </Tooltip>
        <Tooltip title={'Needs Review'}>
          <span>
             <NeedsReviewButtonDark
               onClick={() => onSelect('needsReview')}
               variant={value === 'needsReview' ? 'contained' : undefined}
             >
            <Flag />
            </NeedsReviewButtonDark>
          </span>
        </Tooltip>
      </ButtonGroup>
    );
  }
};
