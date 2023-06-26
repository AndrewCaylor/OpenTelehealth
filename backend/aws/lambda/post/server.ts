import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './index';
import { RequestType, UploadRequest } from './types/types';
import * as express from 'express';
import { readFormDataAsBuffer, readInt16Buffer } from './buffer';

const app = express();

function formathex(buffer: Buffer) {
    let str = "";
    for (let i = 0; i < buffer.length; i++) {
        if (i % 2 === 0) {
            str += " ";
        }
        if (i % 16 === 0) {
            str += "\n";
        }
        // convert to hex and pad with 0
        str += buffer[i].toString(16).padStart(2, '0');

    }
    return str;
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/upload', (req, res) => {
    if (req.method === 'POST') {
        readFormDataAsBuffer(req).then((bufferDict) => {
            for(const key in bufferDict) {
                const buffer = bufferDict[key];
                console.log(formathex(buffer));
            }
        });
    }
    res.status(200).send("OK");
});
app.listen(3000, () => console.log('Example app is listening on port 3000.'));

// const body = {
//     type: RequestType.NewRecording,
//     userId: "yaboi",
//     ecg: {
//     }
// };

// const event = {
//     headers: "",
//     httpMethod: "POST",
//     isBase64Encoded: false,
//     path: "heck",
//     pathParameters: null,
//     queryStringParameters: null,
//     body: Buffer.from(JSON.stringify(body)).toString('base64')
// } as unknown as any;

// const context = {
// } as unknown as any;
