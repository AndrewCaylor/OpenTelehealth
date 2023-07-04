// this is for autocomplete only, put env vars in your .env file
declare global {
    namespace NodeJS {
      interface ProcessEnv {
        ECG_BUCKET: "fitbeatrecordings"
      }
    }
  }

export {}