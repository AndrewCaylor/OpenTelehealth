import { makeInt16Buffer, readInt16Buffer } from "../buffer"
import { describe, expect, test } from '@jest/globals';
import 'dotenv/config';

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