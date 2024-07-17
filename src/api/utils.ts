import { ClearAlignerApi, getApiOptionsWithAuth, OverrideCaApiEndpoint } from '../server/amplifySetup';
import { del, get, patch, post, put } from 'aws-amplify/api';
import { generateJsonString } from '../common/generateJsonString';
import { RestApiResponse } from '@aws-amplify/api-rest/src/types';

export module ApiUtils {

  export enum RequestType {
    GET = 'GET',
    POST = 'POST',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    PUT = 'PUT',
  }

  const getAmplifyFromRequestType = (requestType: RequestType) => {
    switch (requestType) {
      case RequestType.GET:
        return get;
      case RequestType.POST:
        return post;
      case RequestType.PATCH:
        return patch;
      case RequestType.DELETE:
        return del;
      case RequestType.PUT:
        return put;
      default:
        throw new Error('Unable to find Amplify equivalent for: ', requestType);
    }
  };

  const getContentLength = (inputContentLength?: number | string | null) => {
    if (!inputContentLength) {
      return 0;
    }
    return +inputContentLength;
  };

  const getFetchResponseObject = async (response: Response, contentLengthOptional = false) => {
    if (response.status === 200
      && (contentLengthOptional || getContentLength(response.headers.get('content-length')) > 0)) {
      return await (response.json());
    } else {
      return {};
    }
  };

  const getAmplifyResponseObject = async (response: RestApiResponse, contentLengthOptional = false) => {
    if (response.statusCode === 200
      && (contentLengthOptional || getContentLength(response.headers['content-length']) > 0)
      && 'body' in response) {
      return await (response.body as Response).json();
    } else {
      return {};
    }
  };

  const validateStatusCode = (statusCode: number, requestType: RequestType, expectedStatusCode?: number) => {
    if (expectedStatusCode) {
      return statusCode === expectedStatusCode;
    }
    switch (requestType) {
      case RequestType.GET:
      case RequestType.PATCH:
      case RequestType.PUT:
      case RequestType.POST:
        return [200, 201].includes(statusCode);
      case RequestType.DELETE:
        return statusCode === 204;
      default:
        return false;
    }
  };

  interface RequestGenerationPayload {
    requestPath: string,
    requestType: RequestType,
    payload?: any,
    signal?: AbortSignal,
  }

  interface RequestGenerationOptions {
    expectedStatusCode: number;
  }

  export const generateRequest = async ({
                                          requestPath,
                                          requestType,
                                          payload,
                                          signal
                                        }: RequestGenerationPayload, options: Partial<RequestGenerationOptions> = {}) => {
    if (OverrideCaApiEndpoint) {
      const response = await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
        method: requestType,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        ...(signal ? { signal } : {}),
        ...(payload ? { body: generateJsonString(payload) } : {})
      });
      return {
        success: response.ok,
        response: await getFetchResponseObject(response,
          requestType === RequestType.GET)
      };
    } else {
      const responseOperation = getAmplifyFromRequestType(requestType)({
        apiName: ClearAlignerApi,
        path: requestPath,
        options: payload ? getApiOptionsWithAuth(payload) : getApiOptionsWithAuth()
      });
      const response = await responseOperation.response;
      if (signal) {
        signal.onabort = () => {
          responseOperation.cancel();
        };
      }
      return {
        success: validateStatusCode(response.statusCode, requestType, options.expectedStatusCode),
        response: await getAmplifyResponseObject(response as RestApiResponse,
          requestType === RequestType.GET)
      };
    }
  };
}
