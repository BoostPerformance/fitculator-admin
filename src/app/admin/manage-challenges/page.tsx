'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Organization {
  id: string;
  name: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  banner_image_url: string;
  cover_image_url: string;
  challenge_type: string;
  organization_id: string;
}

export default function ManageChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [challengeType, setChallengeType] = useState('');
  const router = useRouter();

  // 챌린지 목록 가져오기
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();
          // 챌린지 데이터 구조에 따라 적절히 처리
          const challengeList = Array.isArray(data)
            ? data.map((item: any) => ({
                id: item.id || item.challenges?.id,
                title: item.title || item.challenges?.title,
                description:
                  item.description || item.challenges?.description || '',
                start_date: item.start_date || item.challenges?.start_date,
                end_date: item.end_date || item.challenges?.end_date,
                banner_image_url:
                  item.banner_image_url ||
                  item.challenges?.banner_image_url ||
                  '',
                cover_image_url:
                  item.cover_image_url ||
                  item.challenges?.cover_image_url ||
                  '',
                challenge_type:
                  item.challenge_type || item.challenges?.challenge_type || '',
                organization_id:
                  item.organization_id ||
                  item.challenges?.organization_id ||
                  '',
              }))
            : [];
          setChallenges(challengeList);
        }
      } catch (error) {
        console.error('챌린지 목록 가져오기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // 조직 목록 가져오기
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data);
        }
      } catch (error) {
        console.error('조직 목록 가져오기 오류:', error);
      }
    };

    fetchOrganizations();
  }, []);

  // 챌린지 수정 모달 열기
  const openEditModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setTitle(challenge.title);
    setDescription(challenge.description || '');
    setStartDate(challenge.start_date);
    setEndDate(challenge.end_date);
    setBannerImageUrl(challenge.banner_image_url || '');
    setCoverImageUrl(challenge.cover_image_url || '');
    setSelectedOrganization(challenge.organization_id);
    setChallengeType(challenge.challenge_type || 'diet_and_exercise');
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedChallenge(null);
    setBannerImage(null);
    setCoverImage(null);
    setUploadProgress(0);
  };

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
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
      return '';
    }
  };

  // 챌린지 수정 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChallenge) return;

    setIsLoading(true);

    try {
      // 이미지 업로드
      let bannerUrl = bannerImageUrl;
      let coverUrl = coverImageUrl;

      if (bannerImage) {
        bannerUrl = await uploadImage(bannerImage, 'challenge-banners');
      }

      if (coverImage) {
        coverUrl = await uploadImage(coverImage, 'challenge-covers');
      }

      // PUT 요청으로 챌린지 업데이트
      const response = await fetch(`/api/challenges/${selectedChallenge.id}`, {
        method: 'PUT',
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
        throw new Error('챌린지 수정에 실패했습니다.');
      }

      // 성공 시 챌린지 목록 새로고침
      const updatedChallenge = await response.json();
      setChallenges(
        challenges.map((c) =>
          c.id === selectedChallenge.id
            ? {
                ...c,
                title: title,
                description: description,
                start_date: startDate,
                end_date: endDate,
                banner_image_url: bannerUrl,
                cover_image_url: coverUrl,
                challenge_type: challengeType,
                organization_id: selectedOrganization,
              }
            : c
        )
      );

      alert('챌린지가 성공적으로 수정되었습니다!');
      closeModal();
    } catch (error) {
      console.error('Error updating challenge:', error);
      alert('챌린지 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // 조직 이름 가져오기
  const getOrganizationName = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    return org ? org.name : '알 수 없음';
  };

  // 챌린지 유형 한글 변환
  const getChallengeTypeText = (type: string) => {
    switch (type) {
      case 'diet':
        return '식단';
      case 'exercise':
        return '운동';
      case 'diet_and_exercise':
        return '식단 및 운동';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">챌린지 관리</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-white dark:bg-blue-4 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            등록된 챌린지가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-white dark:bg-blue-4 rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openEditModal(challenge)}
            >
              <div className="h-40 bg-gray-200 dark:bg-blue-3 relative">
                {challenge.cover_image_url ? (
                  <Image
                    src={challenge.cover_image_url}
                    alt={challenge.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2 dark:text-white">
                  {challenge.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {challenge.description
                    ? challenge.description.length > 100
                      ? `${challenge.description.substring(0, 100)}...`
                      : challenge.description
                    : '설명 없음'}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>조직: {getOrganizationName(challenge.organization_id)}</p>
                  <p>유형: {getChallengeTypeText(challenge.challenge_type)}</p>
                  <p>
                    기간: {new Date(challenge.start_date).toLocaleDateString()}{' '}
                    ~ {new Date(challenge.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 챌린지 수정 모달 */}
      {isModalOpen && selectedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-blue-4 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">
                  챌린지 수정
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
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
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white bg-gray-100"
                    disabled
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
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white bg-gray-100"
                    disabled
                  >
                    <option value="diet">식단</option>
                    <option value="exercise">운동</option>
                    <option value="diet_and_exercise">식단 및 운동</option>
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
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white bg-gray-100"
                    disabled
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
                  {coverImageUrl && (
                    <div className="mb-2 relative h-40 w-full">
                      <Image
                        src={coverImageUrl}
                        alt="현재 커버 이미지"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-md"
                      />
                    </div>
                  )}
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
                  {bannerImageUrl && (
                    <div className="mb-2 relative h-40 w-full">
                      <Image
                        src={bannerImageUrl}
                        alt="현재 배너 이미지"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-md"
                      />
                    </div>
                  )}
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
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-blue-2 dark:text-white dark:hover:bg-blue-3"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '처리 중...' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
