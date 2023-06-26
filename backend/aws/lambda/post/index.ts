import * as mysql from 'mysql';
import * as AWS from 'aws-sdk';
import { Context, APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Buffer } from 'buffer';

import { createCheckers } from 'ts-interface-checker';
import checker from './types/types-ti';
import { Request, UploadRequest, RequestType } from './types/types';
import { handleUploadRequest } from './upload';

const { Request, UploadRequest } = createCheckers(checker);

const requestInvalidFormat = {
    statusCode: 400,
    headers: {
    },
    body: "Invalid request format"
}

export const handler = async (event: APIGatewayEvent, context: Context):
    Promise<APIGatewayProxyResult> => {
    const bodyBuff = Buffer.from(event.body, 'base64');
    const bodyStr = bodyBuff.toString('utf8');
    const body = JSON.parse(bodyStr);

    console.log(body);

    if (Request.test(body)) {
        const request = body as Request;
        switch (request.type) {
            case RequestType.NewRecording:
                if (UploadRequest.test(request)) {
                    handleUploadRequest(request as UploadRequest);
                }
                else {
                    return requestInvalidFormat;
                }
                break;
            default:
                return requestInvalidFormat;
        }
    }
    else {
        return requestInvalidFormat;
    }
};