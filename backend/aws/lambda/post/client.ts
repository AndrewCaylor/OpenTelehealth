
import axios from "axios";
import { makeInt16Buffer, sendBufferAsFormData } from "./buffer";
import * as FormData from "form-data";

console.log("Running");

async function doupload(): Promise<any> {
    const data: number[] = [];
    for (let i = 0; i < 100; i++) {
        data.push(i);
    }
    const buffer = makeInt16Buffer(data, 0, 100);
    sendBufferAsFormData({ecg: buffer}, "http://localhost:3000/upload")
    .then((response: any) => {
        console.log(response.data);
    })
    .catch((error: any) => {
        console.log(error);
    });
}

doupload()