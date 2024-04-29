import { CracoConfig } from '@craco/types';

export default {
  jest: {
    configure: (jestConfig) => {
      jestConfig.testMatch = [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.ui.{spec,test}.{js,jsx,ts,tsx}'
      ];
      return jestConfig;
    }
  },
} as CracoConfig;
