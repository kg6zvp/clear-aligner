import { Amplify } from 'aws-amplify';
import { DocumentType } from '@aws-amplify/core/internals/utils';
import { RestApiOptionsBase } from '@aws-amplify/api-rest/src/types';
import { EnvironmentVariables } from '../structs/environmentVariables';

const environmentVariables = ((window as any).environmentVariables as EnvironmentVariables);

export const OverrideCaApiEndpoint = environmentVariables.caApiEndpoint;
export const OverrideUserPoolId = environmentVariables.userPoolId;
export const OverrideUserPoolClientId = environmentVariables.userPoolClientId;

export const DefaultCaApiEndpoint = 'http://awseb--AWSEB-uI8J0qxyPESc-311978805.us-east-1.elb.amazonaws.com';
export const DefaultUserPoolId = 'us-east-1_63WiOrSMN';
export const DefaultUserPoolClientId = 'jteqgoa1rgptil2tdi7b0nqjb';

export const CaApiEndpointIsDev = (environmentVariables.caApiEndpointIsDev ?? 'false') === 'true';
export const EffectiveCaApiEndpoint = OverrideCaApiEndpoint ?? DefaultCaApiEndpoint;
export const ClearAlignerApiName = 'ClearAlignerApi';

/**
 * One-time setup of AWS amplify capabilities.
 */
export const setUpAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: OverrideUserPoolId ?? DefaultUserPoolId,
        userPoolClientId: OverrideUserPoolClientId ?? DefaultUserPoolClientId,
        identityPoolId: '',
        loginWith: {
          email: true
        },
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true
          }
        },
        allowGuestAccess: true,
        passwordFormat: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: true
        }
      }
    }
  });

  const currConfig = Amplify.getConfig();

  Amplify.configure({
    ...currConfig,
    API: {
      ...currConfig.API,
      REST: {
        ...currConfig.API?.REST,
        ClearAlignerApi: {
          endpoint:
          EffectiveCaApiEndpoint
        }
      }
    }
  });
};

export const getAuthorizationToken = (): string => {
  for (const key in localStorage) {
    if (key.startsWith('CognitoIdentityServiceProvider.')
      && key.endsWith('.accessToken')) {
      return `Bearer ${localStorage[key]}`;
    }
  }
  return '';
};

/**
 * Generate an API document object from an arbitrary input.
 * @param inputObject Any input.
 */
export const getDocumentType = (inputObject?: any): DocumentType => {
  return (inputObject ?? null) as DocumentType;
};

/**
 * Generate an options block ready for use in API calls, including an optional request body.
 * @param inputBody Optional request body.
 */
export const getApiOptionsWithAuth = (inputBody?: any): RestApiOptionsBase => {
  return {
    body: getDocumentType(inputBody),
    headers: {
      Authorization: getAuthorizationToken()
    }
  };
};
