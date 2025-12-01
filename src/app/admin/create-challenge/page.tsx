'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Organization {
  id: string;
  name: string;
}

export default function CreateChallenge() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [challengeType, setChallengeType] = useState('diet_and_exercise');
  const router = useRouter();

  // 조직 목록 가져오기
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data);
          if (data.length > 0) {
            setSelectedOrganization(data[0].id);
          }
        }
      } catch (error) {
// console.error('조직 목록 가져오기 오류:', error);
      }
    };

    fetchOrganizations();
  }, []);

  // 이미지 업로드 핸들러
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBannerImage(e.target.files[0]);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverImage(e.target.files[0]);
    }
  };

  // 이미지를 Supabase Storage에 업로드
  const uploadImage = async (image: File | null, folder: string) => {
    if (!image) return '';

    const fileExt = image.name.split('.').pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    try {
      // 진행 상황을 시뮬레이션하기 위한 간단한 타이머 설정
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const { data, error } = await supabase.storage
        .from('challenge-images')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // 업로드된 이미지의 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('challenge-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
// console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 이미지 업로드
      let bannerUrl = '';
      let coverUrl = '';

      if (bannerImage) {
        bannerUrl = await uploadImage(bannerImage, 'challenge-banners');
      }

      if (coverImage) {
        coverUrl = await uploadImage(coverImage, 'challenge-covers');
      }

      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          banner_image_url: bannerUrl,
          cover_image_url: coverUrl,
          challenge_type: challengeType,
          organization_id: selectedOrganization,
        }),
      });

      if (!response.ok) {
        throw new Error('챌린지 생성에 실패했습니다.');
      }

      const data = await response.json();
      alert('챌린지가 성공적으로 생성되었습니다!');
      router.push(`/${data.id}`);
    } catch (error) {
// console.error('Error creating challenge:', error);
      alert('챌린지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">챌린지 생성</h1>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label
            htmlFor="organization"
            className="block mb-2 font-medium dark:text-white"
          >
            조직
          </label>
          <select
            id="organization"
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          >
            {organizations.length === 0 ? (
              <option value="">조직 없음</option>
            ) : (
              organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="challengeType"
            className="block mb-2 font-medium dark:text-white"
          >
            챌린지 유형
          </label>
          <select
            id="challengeType"
            value={challengeType}
            onChange={(e) => setChallengeType(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          >
            <option value="diet">식단</option>
            <option value="exercise">운동</option>
            <option value="diet_and_exercise">식단 및 운동</option>
            <option value="running">러닝</option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="title"
            className="block mb-2 font-medium dark:text-white"
          >
            챌린지 제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="description"
            className="block mb-2 font-medium dark:text-white"
          >
            챌린지 설명
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            rows={4}
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="coverImage"
            className="block mb-2 font-medium dark:text-white"
          >
            커버 사진 (리스트나 썸네일용)
          </label>
          <input
            type="file"
            id="coverImage"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="bannerImage"
            className="block mb-2 font-medium dark:text-white"
          >
            배너 사진 (상세 페이지용)
          </label>
          <input
            type="file"
            id="bannerImage"
            accept="image/*"
            onChange={handleBannerImageChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
          />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="startDate"
            className="block mb-2 font-medium dark:text-white"
          >
            시작 날짜
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="endDate"
            className="block mb-2 font-medium dark:text-white"
          >
            종료 날짜
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '처리 중...' : '챌린지 생성'}
        </button>
      </form>
    </div>
  );
}
