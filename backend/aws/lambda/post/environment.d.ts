// this is for autocomplete only, put env vars in your .env file
declare global {
    namespace NodeJS {
      interface ProcessEnv {
        ECG_BUCKET: "ecg-data-bucket"
      }
    }
  }

export {}