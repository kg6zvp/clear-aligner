import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { UserPreference } from '../state/preferences/tableManager';

const useTrackLocation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preferences, setPreferences, projectState } = React.useContext(AppContext);
  const [redirected, setRedirected] = React.useState(false);


  React.useEffect(() => {
    if(preferences?.id && preferences?.page && !redirected) {
      setRedirected(true);
      navigate(preferences.page);
    }
  }, [preferences?.page, redirected]);

  React.useEffect(() => {
    setPreferences((p: UserPreference | undefined) => {
      const updatedPreferences = { ...((p ?? {}) as UserPreference), page: location.pathname };
      projectState.userPreferenceTable?.saveOrUpdate?.(updatedPreferences);
      return updatedPreferences;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
};

export default useTrackLocation;
