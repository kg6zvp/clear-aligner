import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { UserPreference } from '../state/preferences/tableManager';

const useTrackLocation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {preferences, setPreferences, projectState} = React.useContext(AppContext);
  const navigated = React.useRef(false);

  const [initialPagePreference, setInitialPagePreference] = React.useState(preferences?.page);

  React.useEffect(() => {
    if(!initialPagePreference && preferences?.page) {
      setInitialPagePreference(preferences.page);
    }
  }, [preferences])

  React.useEffect(() => {
    if(!initialPagePreference) {
      return;
    }
    if(!navigated.current) {
      navigate(initialPagePreference);
      navigated.current = true;
      return;
    }
    setPreferences((p: UserPreference | undefined) => {
      const updatedPreferences = {...((p ?? {}) as UserPreference), page: location.pathname};
      projectState.userPreferenceTable?.saveOrUpdate?.(updatedPreferences);
      return updatedPreferences;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, initialPagePreference]);
}

export default useTrackLocation;
