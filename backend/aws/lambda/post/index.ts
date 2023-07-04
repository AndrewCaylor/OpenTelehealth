import * as mysql from 'mysql';
import * as AWS from 'aws-sdk';
import { Context, APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Buffer } from 'buffer';

import { createCheckers } from 'ts-interface-checker';
import checker from './types/types-ti';
import { BeatRequest, UploadRequest, RequestType } from './types/types';
import { handleUploadRequest } from './load';
import { Auth, AuthLevel } from './auth';

const { BeatRequest, UploadRequest } = createCheckers(checker);

const requestInvalidFormat = {
    statusCode: 400,
    headers: {
    },
    body: "Invalid request format"
}

const requestInvalidAuth = {
    statusCode: 401,
    headers: {
    },
    body: "Invalid credentials"
}

export const handler = async (event: APIGatewayEvent, context: Context):
    Promise<APIGatewayProxyResult> => {
    const body = event.body as unknown;

    console.log(event.body)

    if (!BeatRequest.test(body)) {
        return requestInvalidFormat;
    }

    const request = body as BeatRequest;
    Auth.handleAuthRequest(request.username, request.password).then((user) => {
        console.log(user, request);
        const authLevel = Auth.getAuthLevel(user);

        if (authLevel == AuthLevel.None) {
            return requestInvalidAuth;
        }

        switch (request.type) {
            case RequestType.NewRecording:
                if (!UploadRequest.test(request)) {
                    return requestInvalidFormat;
                }

                const userSub = user.UserAttributes.find((attr) => attr.Name === "sub").Value;
                return handleUploadRequest(request as UploadRequest, userSub).then((res) => {
                    return {
                        statusCode: 200,
                        headers: {
                        },
                        body: JSON.stringify(res)
                    }
                });
                break;
            default:
                return requestInvalidFormat;
        }
    }).catch((err) => {
        console.log(err);
        return requestInvalidAuth;
    });
};