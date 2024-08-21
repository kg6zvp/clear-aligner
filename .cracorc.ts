import { CracoConfig } from '@craco/types';
import webpack from 'webpack';
import * as dotenv from 'dotenv';
import { build } from 'electron-builder';

dotenv.config();

const buildTimeEnvironmentRawValues = {
  CA_AWS_ENDPOINT: process.env.CA_AWS_ENDPOINT,
  CA_AWS_COGNITO_USER_POOL_ID: process.env.CA_AWS_COGNITO_USER_POOL_ID,
  CA_AWS_COGNITO_USER_POOL_CLIENT_ID: process.env.CA_AWS_COGNITO_USER_POOL_CLIENT_ID,
};

if (Object.values(buildTimeEnvironmentRawValues).some(v => !v)) {
  throw 'Environment file not configured! Exiting!';
}

const buildTimeEnvironment: { [k: string]: string } = {};

Object.keys(buildTimeEnvironmentRawValues)
  .forEach((key) => {
    buildTimeEnvironment[key] = JSON.stringify((buildTimeEnvironmentRawValues as any)[key]);
  });

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
  webpack: {
    plugins: {
      add: [
        [ new webpack.DefinePlugin(buildTimeEnvironment), 'append'],
      ]
    }
  }
} as CracoConfig;
