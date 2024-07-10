import { ClearAlignerApi, getApiOptionsWithAuth, OverrideCaApiEndpoint } from '../server/amplifySetup';
import { get, post, patch, del, put } from 'aws-amplify/api';
import { generateJsonString } from '../common/generateJsonString';

export module ApiUtils {

  export enum RequestType {
    GET = 'GET',
    POST = 'POST',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    PUT = 'PUT',
  }

  const getAmplifyFromRequestType = (requestType: RequestType) => {
    switch(requestType) {
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
        throw new Error("Unable to find Amplify equivalent for: ", requestType);
    }
  }

  const getResponseObject = async (response: Response) => {
    try {
      return await response.json();
    } catch (x) {
      return {};
    }
  }

  const validateStatusCode = (statusCode: number, requestType: RequestType, expectedStatusCode?: number) => {
    if(expectedStatusCode) {
      return statusCode === expectedStatusCode;
    }
    switch(requestType) {
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
  }

  interface RequestGenerationPayload {
    requestPath: string,
    requestType: RequestType,
    payload?: any,
    signal?: AbortSignal,
  }

  interface RequestGenerationOptions {
    expectedStatusCode: number;
  }

  export const generateRequest = async ({requestPath, requestType, payload, signal}: RequestGenerationPayload, options: Partial<RequestGenerationOptions> = {}) => {
    if (OverrideCaApiEndpoint) {
      const response = await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
        method: requestType,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        ...(signal ? {signal} : {}),
        ...(payload ? {body: generateJsonString(payload)} : {})
      });
      return {
        success: response.ok,
        response: await getResponseObject(response)
      }
    } else {
      const responseOperation = getAmplifyFromRequestType(requestType)({
        apiName: ClearAlignerApi,
        path: requestPath,
        options: payload ? getApiOptionsWithAuth(payload) : getApiOptionsWithAuth()
      });
      const projectResponse = await responseOperation.response;
      if(signal) {
        signal.onabort = () => {
          responseOperation.cancel();
        };
      }
      let response = undefined;
      if('body' in projectResponse) {
        response = await (projectResponse.body as Response).json();
      }
      return {
        success: validateStatusCode(projectResponse.statusCode, requestType, options.expectedStatusCode),
        response,
      }
    }
  }
}
