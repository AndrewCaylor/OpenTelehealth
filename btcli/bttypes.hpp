
struct recordReq {
  int durationms;
  int samplerate;
  int bitsprecision;
};

struct recordRes {
  int durationms;
  int samplerate;
  int bitsprecision;
  int length;
};