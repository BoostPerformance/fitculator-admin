const MAX_DURATION_SECONDS = 5 * 60; // 5분
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

/** 영상 길이를 <video> 엘리먼트로 측정 */
function getVideoDuration(file: File): Promise<number> {
 return new Promise((resolve, reject) => {
  const video = document.createElement('video');
  video.preload = 'metadata';

  video.onloadedmetadata = () => {
   URL.revokeObjectURL(video.src);
   resolve(video.duration);
  };

  video.onerror = () => {
   URL.revokeObjectURL(video.src);
   reject(new Error('영상 파일을 읽을 수 없습니다.'));
  };

  video.src = URL.createObjectURL(file);
 });
}

/**
 * 영상 파일의 타입, 크기, 길이를 검증
 * - 허용 형식: MP4, MOV, WebM
 * - 최대 크기: 100MB
 * - 최대 길이: 5분
 */
export async function validateVideo(file: File): Promise<void> {
 if (!ACCEPTED_TYPES.includes(file.type)) {
  throw new Error('지원하지 않는 파일 형식입니다. MP4, MOV, WebM만 가능합니다.');
 }

 if (file.size > MAX_FILE_SIZE) {
  throw new Error(`파일 크기가 ${Math.round(file.size / 1024 / 1024)}MB입니다. 최대 100MB까지 업로드할 수 있습니다.`);
 }

 const duration = await getVideoDuration(file);
 if (duration > MAX_DURATION_SECONDS) {
  throw new Error(`영상 길이가 ${Math.ceil(duration / 60)}분입니다. 최대 5분까지 업로드할 수 있습니다.`);
 }
}
