const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = 'program-videos';

export type UploadProgressCallback = (percent: number) => void;

/**
 * 영상 파일을 Supabase Storage에 직접 업로드 (XHR - progress 지원)
 * Vercel body 4.5MB 제한을 우회하기 위해 API route를 경유하지 않음
 *
 * @param file - 업로드할 영상 파일
 * @param cardId - 카드 ID (파일 경로에 사용)
 * @param onProgress - 업로드 진행률 콜백 (0~100)
 * @returns Supabase public URL
 */
export function uploadVideo(
 file: File,
 cardId: string,
 onProgress?: UploadProgressCallback,
): Promise<string> {
 return new Promise((resolve, reject) => {
  const sanitizedName = file.name
   .replace(/\.[^.]+$/, '')
   .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
   .slice(0, 50);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const timestamp = Date.now();
  const filePath = `${cardId}/${timestamp}-${sanitizedName}.${ext}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filePath}`;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
  xhr.setRequestHeader('Content-Type', file.type);
  xhr.setRequestHeader('Cache-Control', '3600');

  if (onProgress) {
   xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
     onProgress(Math.round((e.loaded / e.total) * 100));
    }
   };
  }

  xhr.onload = () => {
   if (xhr.status >= 200 && xhr.status < 300) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
    resolve(publicUrl);
   } else {
    reject(new Error(`업로드 실패 (${xhr.status}): ${xhr.responseText}`));
   }
  };

  xhr.onerror = () => {
   reject(new Error('네트워크 오류로 업로드에 실패했습니다.'));
  };

  xhr.send(file);
 });
}
