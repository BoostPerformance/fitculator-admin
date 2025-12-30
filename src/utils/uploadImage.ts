/**
 * 이미지 파일을 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
 * @param file - 업로드할 이미지 파일
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  const data = await response.json();
  return data.url;
}
