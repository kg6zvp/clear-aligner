import { createVirtualTableLinks, VirtualTableLinks } from './tableManager';
import { useEffect, useState } from 'react';

export const useLinksTable = (): VirtualTableLinks|undefined => {
  const [ linksTable, setLinksTable ] = useState(undefined as VirtualTableLinks|undefined);

  useEffect(() => {
    createVirtualTableLinks()
      .then(setLinksTable);
  }, [linksTable, setLinksTable]);

  return linksTable;
}
