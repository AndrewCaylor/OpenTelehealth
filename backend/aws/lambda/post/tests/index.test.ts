import { makeInt16Buffer, readInt16Buffer } from "../buffer"
import { describe, expect, test } from '@jest/globals';
import 'dotenv/config';

import { handleUploadRequest, handleDownloadRequest } from '../load';
import { RequestType } from "../types/types";
import { ECG } from "../types/types-ti";

describe('makeInt16Buffer', () => {
    test('should return a buffer packed correctly', () => {
        const arr = [0, 64, 128, 512];

        const buffer = makeInt16Buffer(arr, 0, 65535);
        expect(buffer).toBeInstanceOf(Buffer);
        for (let i = 0; i < buffer.length; i += 2) {
            const val = buffer.readUInt16LE(i);
            expect(val).toEqual(arr[i / 2]);
        }
    });

    test('pack and unpack', () => {
        const arr = [0, 1, 2, 3];
        const buffer = makeInt16Buffer(arr, 0, 65535);
        const unpacked = readInt16Buffer(buffer, 0, 65535);
        for (let i = 0; i < arr.length; i++) {
            expect(unpacked[i]).toEqual(arr[i]);
        }
    });
});

describe('env', () => {
    test('env', () => {
        expect(process.env["ECG_BUCKET"]).toBeTruthy()
    })
})

describe('up/down integration', () => {
    test('basic upload and download', async () => {
        await handleUploadRequest({
            type: RequestType.NewRecording,
            ecg: {
                I: "AAAAAA==",
            },
            sampleRate: 100,
            startTime: 0,
            // bypassing auth so username and password not needed
            username: "",
            password: "",
        }, "d4183478-c061-708b-a645-8c0c40d4f0bb").then((res) => {

            if(res.statusCode !== 200) {
                console.log(res);
            }
            expect(res.statusCode).toBe(200);

            return handleDownloadRequest(res.body).then((res) => {
                console.log(res);
                expect(res.ecg.I).toEqual("AAAAAA==");
            });
        });
    });
});