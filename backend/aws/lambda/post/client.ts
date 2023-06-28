
import { makeInt16Buffer, sendBufferAsFormData } from "./buffer";
import * as FormData from "form-data";
import 'dotenv/config';
import { Auth } from "./auth";
import { BeatRequest, RequestType, UploadRequest } from "./types/types";
import axios from "axios";

console.log("Running");

async function doupload(): Promise<any> {
    const data: number[] = [];
    for (let i = 0; i < 100; i++) {
        data.push(i);
    }
    const buffer = makeInt16Buffer(data, 0, 100);
    const request: UploadRequest = {
        username: "andrewc01@vt.edu",
        password: "AdminPass1",
        type: RequestType.NewRecording,
        ecg: {
            I: buffer.toString('base64'),
        },
        sampleRate: 100,
        startTime: 0,
    }

    axios.post("http://localhost:3000/upload", request).then((res) => {
        console.log(res);
    });
}

doupload()