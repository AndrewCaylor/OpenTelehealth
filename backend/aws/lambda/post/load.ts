import { DownloadRes, ECG, ECGMeta, UploadRequest } from "./types/types";
import * as mysql from 'mysql';
import * as AWS from 'aws-sdk';
import 'dotenv/config';
import { readInt16Buffer } from "./buffer";

const s3 = new AWS.S3({ region: 'us-east-1' });

namespace Querys {
    export const newRecording = `INSERT INTO testdb.recordings (username, location, locationmeta)
VALUES (?, ?, ?);`;

    export const deleteRecording = `DELETE FROM testdb.recordings
WHERE location = ?`;

}

namespace Responses {
    export const success = (body: string) => {
        return {
            statusCode: 200,
            headers: {
            },
            body
        }
    }

    export const failure = (body: string) => {
        return {
            statusCode: 500,
            headers: {
            },
            body
        }
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
    let bufs = [];
    for (const key in req.ecg) {
        const b64 = req.ecg[key as keyof typeof req.ecg];
        const buf = Buffer.from(b64, 'base64');
        bufs.push(buf);
    }
    const ecgBuf = Buffer.concat(bufs);

    const metadata: ECGMeta = {
        sampleRate: req.sampleRate,
        startTime: req.startTime,
        leads: Object.keys(req.ecg),
        numSamples: bufs.map((buf) => buf.length / 2),
    };

    // generate a unique home for the data
    const location = uniqueStr();
    const metalocation = location + "m"; //ensure that the metadata is stored in a different location
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
                return Responses.failure(JSON.stringify(res));
            });
        }

        return Responses.success(location);
    });  
}

export function handleDownloadRequest(location: string) {
    const metalocation = location + "m";

    const s3DataPutRes = s3.getObject({
        Bucket: process.env.ECG_BUCKET,
        Key: `${location}.bin`,
    }).promise();
    const s3MetaPutRes = s3.getObject({
        Bucket: process.env.ECG_BUCKET,
        Key: `${metalocation}.json`,
    }).promise();

    return Promise.all([s3DataPutRes, s3MetaPutRes]).then((res) => {
        const metadata = JSON.parse(res[1].Body.toString()) as ECGMeta;
        const allLeadsData = res[0].Body;

        const downloadRes: DownloadRes = {
            ecg: {},
            sampleRate: metadata.sampleRate,
            startTime: metadata.startTime,
        };

        // split the data into the individual leads
        let offset = 0;
        for (let i = 0; i < metadata.leads.length; i++) {
            const lead = metadata.leads[i];
            const numSamples = metadata.numSamples[i];

            const leadData = Buffer.from(allLeadsData as Buffer, offset, numSamples * 2);
            downloadRes.ecg[lead as keyof ECG] = leadData.toString('base64');

            offset += numSamples * 2;
        }

        return downloadRes;
    });
}

export function handleSearchRequest() {

}