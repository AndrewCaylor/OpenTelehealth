import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './index';
import { RequestType, UploadRequest } from './types/types';
import * as express from 'express';
import { formathex, readFormDataAsBuffer, readInt16Buffer } from './buffer';

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const event = {
    headers: "",
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "heck",
    pathParameters: null,
    queryStringParameters: null,
    body: ""
} as unknown as any;

const context = {
} as unknown as any;

app.post('/upload', (req, res) => {
    event.body = req.body;
    event.headers = req.headers;
    event.path = req.path;
    event.queryStringParameters = req.query;
    handler(event, context).then((result) => {
        res.status(200).send(result);
    });
});
app.listen(3000, () => console.log('Example app is listening on port 3000.'));