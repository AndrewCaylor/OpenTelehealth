
export enum RequestType {
    SignUp = 'signup',
    AddUserToClinic = 'addUserToClinic',
    NewRecording = 'newRecording',
    GetRecording = 'getRecording',
}

export interface BeatRequest {
    type: RequestType;
    username: string;
    password: string;
}

export interface ECG {
    I?: string;
    II?: string;
    III?: string;
    aVR?: string;
    aVL?: string;
    aVF?: string;
    V1?: string;
    V2?: string;
    V3?: string;
    V4?: string;
}

export interface ECGMeta {
    leads: string[]; // keyof ECG
    numSamples: number[]; // number of samples in each lead
    sampleRate: number;
    startTime: number;
}

export interface UploadRequest extends BeatRequest {
    type: RequestType.NewRecording;
    ecg: ECG;
    sampleRate: number;
    startTime: number;
}

export interface DownloadRes {
    ecg: ECG;
    sampleRate: number;
    startTime: number;
}