import { useContext, useEffect, useMemo, useState } from 'react';
import { getUserGroups } from '../server/amplifySetup';
import uuid from 'uuid-random';
import { useNetworkState } from '@uidotdev/usehooks';
import { AppContext } from '../App';
import { userState } from '../features/profileAvatar/profileAvatar';

/**
 * name of the admin group, for comparison
 */
export const ADMIN_GROUP = 'admin';

/**
 * props for {@link useCurrentUserGroups} hook
 */
export interface UseCurrentUserGroupsProps {
  forceRefresh?: boolean;
  refreshKey?: string
}

/**
 * Retrieve the list of groups the current user belongs to
 * @param forceRefresh whether the request for the current user's groups should trigger a refresh from the server
 * @param refreshKey updating this key triggers an update
 */
export const useCurrentUserGroups = ({ forceRefresh, refreshKey }: UseCurrentUserGroupsProps) => {
  const [ groups, setGroups ] = useState<string[]>();
  const [ lastRefreshKey, setLastRefreshKey ] = useState<string>(uuid());
  const network = useNetworkState();

  useEffect(() => {
    if (lastRefreshKey === refreshKey) return;
    if (!network?.online) return;
    getUserGroups(forceRefresh)
      .then((groups) => {
        setGroups(groups ?? []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!!refreshKey)
          setLastRefreshKey(refreshKey);
      })
  }, [forceRefresh, refreshKey, setLastRefreshKey, lastRefreshKey, network?.online]);

  return groups;
}

/**
 * hook to retrieve whether the user is currently signed in
 */
export const useIsSignedIn = (): boolean => {
  const { userStatus } = useContext(AppContext);

  return useMemo(() => userStatus === userState.LoggedIn || userStatus === userState.CustomEndpoint, [userStatus]);
}
