import React, { useMemo, useState } from 'react';
import BCVNavigation, { BCVNavigationProps } from './BCVNavigation';
import { Meta } from '@storybook/react';
import BCVWP from '../bcvwp/BCVWPSupport';

const meta: Meta<typeof BCVNavigation> = {
  title: 'BCVNavigation',
  component: BCVNavigation,
};

export default meta;

export const Default = (props: BCVNavigationProps) => (
  <BCVNavigation {...props} />
);
Default.args = {
  words: [
    {
      id: '45005003001',
    },
    {
      id: '48006002001',
    },
  ],
} as BCVNavigationProps;

export const Horizontal = (props: BCVNavigationProps) => (
  <BCVNavigation {...props} />
);
Horizontal.args = {
  horizontal: true,
  words: [
    {
      id: '45005003001',
    },
    {
      id: '48006002001',
    },
  ],
} as BCVNavigationProps;

export const Disabled = (props: BCVNavigationProps) => (
  <BCVNavigation {...props} />
);
Disabled.args = {
  disabled: true,
  words: [
    {
      id: '45005003001',
    },
    {
      id: '48006002001',
    },
  ],
} as BCVNavigationProps;

export const WithCurrentPositionAtGalatians6_2 = (
  props: BCVNavigationProps
) => {
  const [currentPosition, setCurrentPosition] = useState(props.currentPosition);
  const currentPositionDelegate = useMemo(
    () => (currentPosition: BCVWP) => {
      setCurrentPosition(currentPosition);
      props?.onNavigate?.(currentPosition);
    },
    [props?.onNavigate, setCurrentPosition]
  );
  return (
    <BCVNavigation
      words={props.words}
      currentPosition={currentPosition}
      onNavigate={currentPositionDelegate}
    />
  );
};
WithCurrentPositionAtGalatians6_2.args = {
  words: [
    {
      id: '45005001001',
    },
    {
      id: '45005002001',
    },
    {
      id: '45005003001',
    },
    {
      id: '45005004001',
    },
    {
      id: '45005005001',
    },
    {
      id: '45005006001',
    },
    {
      id: '48006002001',
    },
  ],
  currentPosition: new BCVWP(48, 6, 2),
} as BCVNavigationProps;
