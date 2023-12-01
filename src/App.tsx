import './App.css';

import Workbench from 'workbench';

import './styles/theme.css';
import { Provider } from 'react-redux';
import { store } from 'app/store';

function App() {
  return (
    <Provider store={store}>
      <Workbench />
    </Provider>
  );
}

export default App;
