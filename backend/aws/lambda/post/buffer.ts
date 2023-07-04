
import axios from "axios";
import * as FormData from "form-data";
import * as fs from "fs";
import { IncomingMessage } from "http";
import * as multiparty from "multiparty";

interface BufferDict {
    [key: string]: Buffer;
}

interface B64Dict {
    [key: string]: string;
}

export function sendBufferAsFormData(bufferDict: BufferDict, url: string): Promise<any> {
    const formdata = new FormData();
    for (const key in bufferDict) {
        const buffer = bufferDict[key];
        formdata.append(key, buffer, `${key}.bin`);
    }
    return axios.post(url, formdata, {
        headers: {
            "Content-Length": formdata.getLengthSync()
        }
    });
}

export function readFormDataAsBuffer(req: IncomingMessage): Promise<BufferDict> {
    return new Promise((resolve, reject) => {
        const form = new multiparty.Form();
        const res = {} as BufferDict;

        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
            }
            for(const key in files) {
                const file = files[key][0];
                const path = file.path;
                const buffer = fs.readFileSync(path);
                res[key] = buffer;
            }
            resolve(res);
        });
    });
}

export function splitBuffer(buffer: Buffer, lengths: number[]): Buffer[] {
    const totalsize = lengths.reduce((a, b) => a + b, 0);
    if (totalsize !== buffer.length) {
        throw new Error("Lengths do not match buffer size");
    }

    const res = [];
    let offset = 0;
    for (const split of lengths) {
        const buf = Buffer.from(buffer, offset, split);
        res.push(buf);
        offset += split;
    }
    return res;
}

export function makeInt16Buffer(data: number[], min?: number, max?: number): Buffer {
    const datamin = Math.min(...data);
    const datamax = Math.max(...data);

    const int16size = 65535;

    // return zero buffer if all data is the same and min/max are not specified
    if (datamin === datamax && (min === undefined || max === undefined)) {
        return Buffer.alloc(data.length * 2);
    }

    // cut the data to fit in the range if needed
    if (min === undefined || datamin < min) {
        min = datamin;
    }
    if (max === undefined || datamax > max) {
        max = datamax;
    }

    // scale data to fit in range [min, max]
    const scaled = data.map((val) => {
        return ((val - min) / (max - min)) * int16size;
    });

    // create buffer
    const buffer = Buffer.alloc(scaled.length * 2);
    for (let i = 0; i < scaled.length; i++) {
        buffer.writeUInt16LE(scaled[i], i * 2);
    }
    return buffer;
}

export function readInt16Buffer(buffer: Buffer, min?: number, max?: number) {
    const int16size = 65535;

    const data = [];
    for (let i = 0; i < buffer.length; i += 2) {
        const val = buffer.readUInt16LE(i);
        data.push(val);
    }

    console.log(data)

    if (min === undefined) {
        min = Math.min(...data);
    }
    if (max === undefined) {
        max = Math.max(...data);
    }

    const scaled = data.map((val) => {
        return ((val / int16size) * (max - min)) + min;
    });

    return scaled;
}

export function formathex(buffer: Buffer){
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