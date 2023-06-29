import { ECGMeta, UploadRequest } from "./types/types";
import * as mysql from 'mysql';
import * as AWS from 'aws-sdk';
import 'dotenv/config';

const s3 = new AWS.S3({ region: 'us-east-1' });

namespace Querys {
    export const newRecording = `INSERT INTO testdb.recordings 
VALUES (??, ??, ??)`;

    export const deleteRecording = `DELETE FROM testdb.recordings
WHERE location = ??`;

}

namespace Responses {
    export const success = {
        statusCode: 200,
        headers: {
        },
        body: "Success"
    }

    export const failure = {
        statusCode: 500,
        headers: {
        },
        body: "Failure"
    }
}

function makeConnection() {
    return mysql.createConnection({
        host: 'mydb.c3uqkzjashmi.us-east-1.rds.amazonaws.com',
        port: 3306,
        user: 'admin',
        password: 'ZTBtC}hm6geM39+',
    });
}

function dbQuery(connection: mysql.Connection, query: string, params: any[]) {
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) reject(err);
            connection.query(query, params, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    });
}

function uniqueStr() {
    return Math.random().toString(36) + Math.random().toString(36);
}

export function handleUploadRequest(req: UploadRequest, sub: string) {
    // combine all the buffers into one
    let ecgBuf = Buffer.alloc(0);
    for (const key in req.ecg) {
        const b64 = req.ecg[key as keyof typeof req.ecg];
        const buf = Buffer.from(b64, 'base64');
        ecgBuf = Buffer.concat([ecgBuf, buf]);
    }

    const metadata: ECGMeta = {
        sampleRate: req.sampleRate,
        startTime: req.startTime,
        positions: Object.keys(req.ecg),
    };

    // generate a home for the data
    const location = uniqueStr();
    const metalocation = location + "m";
    const connection = makeConnection();

    const s3DataPutRes = s3.putObject({
        Bucket: process.env.ECG_BUCKET,
        Key: `${location}.bin`,
        Body: ecgBuf,
        ContentType: "application/octet-stream"
    }).promise();

    const s3MetaPutRes = s3.putObject({
        Bucket: process.env.ECG_BUCKET,
        Key: `${metalocation}.json`,
        Body: JSON.stringify(metadata),
        ContentType: "application/json"
    }).promise();

    const dbRes = dbQuery(connection, Querys.newRecording, [sub, location, metalocation]);

    return Promise.allSettled([dbRes, s3DataPutRes, s3MetaPutRes]).then((res) => {
        const failed = res.some((res) => res.status === "rejected");

        // if any of the promises failed, destroy the data to keep the database consistent
        if (failed) {
            const toDestroy = [];
            if (res[0].status !== "rejected") {
                toDestroy.push(dbQuery(connection, Querys.deleteRecording, [location]));
            }
            if (res[1].status !== "rejected") {
                toDestroy.push(s3.deleteObject({
                    Bucket: process.env.ECG_BUCKET,
                    Key: `${location}.bin`
                }).promise());
            }
            if (res[2].status !== "rejected") {
                toDestroy.push(s3.deleteObject({
                    Bucket: process.env.ECG_BUCKET,
                    Key: `${metalocation}.json`
                }).promise());
            }

            return Promise.all(toDestroy).then(() => {
                return Responses.failure;
            });
        }

        return Responses.success;
    });
}