import { Tooltip, TooltipProps } from '@mui/material';
import { PropsWithChildren } from 'react';


export interface RemovableTooltipProps extends TooltipProps {
  removed?: boolean;
}

export const RemovableTooltip = ({ removed, children, ...others }: PropsWithChildren<RemovableTooltipProps>) =>
  <>
    {removed ?
      <>{ children }</> :
      <Tooltip {...others}>
        {children}
      </Tooltip>
    }
  </>
