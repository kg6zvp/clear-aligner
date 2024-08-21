import { CracoConfig } from '@craco/types';
import webpack from 'webpack';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.CA_AWS_ENDPOINT
    || !process.env.CA_AWS_COGNITO_USER_POOL_ID
    || !process.env.CA_AWS_COGNITO_USER_POOL_CLIENT_ID) {
  throw 'Environment secrets not configured! Exiting!';
}

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
        [ new webpack.DefinePlugin({
          CA_AWS_ENDPOINT: JSON.stringify(process.env.CA_AWS_ENDPOINT),
          CA_AWS_COGNITO_USER_POOL_ID: JSON.stringify(process.env.CA_AWS_COGNITO_USER_POOL_ID),
          CA_AWS_COGNITO_USER_POOL_CLIENT_ID: JSON.stringify(process.env.CA_AWS_COGNITO_USER_POOL_CLIENT_ID),
        }), 'append'],
      ]
    }
  }
} as CracoConfig;
