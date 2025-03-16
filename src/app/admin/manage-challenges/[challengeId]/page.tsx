'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Title from '@/components/layout/title';

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

interface Participant {
  id: string;
  email: string;
  name?: string;
  username?: string;
  created_at: string;
  status?: string;
}

export default function ChallengeDetail({
  params,
}: {
  params: { challengeId: string };
}) {
  const { challengeId } = params;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(false);
  const router = useRouter();

  // 챌린지 정보 가져오기
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/challenges/${challengeId}`);
        if (response.ok) {
          const data = await response.json();
          setChallenge(data);
          setTitle(data.title);
          setDescription(data.description || '');
          setStartDate(data.start_date);
          setEndDate(data.end_date);
          setBannerImageUrl(data.banner_image_url || '');
          setCoverImageUrl(data.cover_image_url || '');
          setSelectedOrganization(data.organization_id);
          setChallengeType(data.challenge_type || 'diet_and_exercise');
        } else {
          console.error('챌린지 정보 가져오기 실패:', await response.text());
        }
      } catch (error) {
        console.error('챌린지 정보 가져오기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId]);

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

  // 참가자 목록 가져오기
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(
          `/api/challenge-participants?challenge_id=${challengeId}`
        );
        if (response.ok) {
          const data = await response.json();
          setParticipants(
            data.data.map((participant: any) => ({
              id: participant.id,
              email: participant.users?.email || '이메일 없음',
              name: participant.users?.name || '',
              username: participant.users?.username || '',
              created_at: participant.created_at,
              status: participant.status || 'inactive',
            }))
          );
        }
      } catch (error) {
        console.error('참가자 목록 가져오기 오류:', error);
      }
    };

    if (challengeId) {
      fetchParticipants();
    }
  }, [challengeId]);

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

    if (!challenge) return;

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
      const response = await fetch(`/api/challenges/${challengeId}`, {
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

      // 성공 시 챌린지 정보 업데이트
      const updatedChallenge = await response.json();
      setChallenge(updatedChallenge);
      alert('챌린지가 성공적으로 수정되었습니다!');
    } catch (error) {
      console.error('Error updating challenge:', error);
      alert('챌린지 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // 참가자 상태 토글 핸들러
  const handleToggleStatus = async (
    participantId: string,
    currentStatus: string
  ) => {
    // 상태 변경 확인
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const confirmMessage =
      newStatus === 'active'
        ? '이 참가자를 활성화하시겠습니까?'
        : '이 참가자를 비활성화하시겠습니까?';

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      console.log('클라이언트에서 상태 토글 요청:', {
        participantId,
        status: newStatus,
      });

      const requestBody = {
        participantId,
        status: newStatus,
      };

      console.log('요청 본문:', JSON.stringify(requestBody));

      const response = await fetch('/api/challenge-participants', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참가자 상태 변경에 실패했습니다.');
      }

      // 참가자 목록 업데이트
      setParticipants(
        participants.map((p) =>
          p.id === participantId ? { ...p, status: newStatus } : p
        )
      );
    } catch (error) {
      console.error('참가자 상태 변경 오류:', error);
      alert(
        error instanceof Error
          ? error.message
          : '참가자 상태 변경 중 오류가 발생했습니다.'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 참가자 삭제 핸들러
  const handleDeleteParticipant = async (participantId: string) => {
    // 삭제 확인
    if (!confirm('정말로 이 참가자를 삭제하시겠습니까?')) {
      return;
    }

    setIsDeletingParticipant(true);

    try {
      const response = await fetch(
        `/api/challenge-participants?participantId=${participantId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참가자 삭제에 실패했습니다.');
      }

      // 참가자 목록 업데이트
      setParticipants(participants.filter((p) => p.id !== participantId));
    } catch (error) {
      console.error('참가자 삭제 오류:', error);
      alert(
        error instanceof Error
          ? error.message
          : '참가자 삭제 중 오류가 발생했습니다.'
      );
    } finally {
      setIsDeletingParticipant(false);
    }
  };

  // 참가자 추가 핸들러
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newParticipantEmail.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    setIsAddingParticipant(true);

    try {
      const response = await fetch('/api/challenge-participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          email: newParticipantEmail,
          name: newParticipantName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참가자 추가에 실패했습니다.');
      }

      const newParticipantData = await response.json();

      // 참가자 목록 업데이트
      setParticipants([
        ...participants,
        {
          id: newParticipantData.id,
          email: newParticipantData.user_info.email,
          name: newParticipantData.user_info.name || '',
          username: newParticipantData.user_info.username || '',
          created_at: new Date().toISOString(),
          status: 'inactive', // 기본값으로 비활성 상태 설정
        },
      ]);

      // 입력 필드 초기화
      setNewParticipantEmail('');
      setNewParticipantName('');

      alert('참가자가 성공적으로 추가되었습니다!');
    } catch (error) {
      console.error('참가자 추가 오류:', error);
      alert(
        error instanceof Error
          ? error.message
          : '참가자 추가 중 오류가 발생했습니다.'
      );
    } finally {
      setIsAddingParticipant(false);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-blue-4 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            챌린지를 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Title title="챌린지 관리" />
        <button
          onClick={() => router.push('/admin/manage-challenges')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-blue-3 dark:text-white dark:hover:bg-blue-2"
        >
          목록으로 돌아가기
        </button>
      </div>

      <div className="bg-white dark:bg-blue-4 rounded-lg shadow-lg overflow-hidden mb-8">
        {bannerImageUrl && (
          <div className="w-full h-48 relative">
            <Image
              src={bannerImageUrl}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">{title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-semibold">조직:</span>{' '}
                {getOrganizationName(selectedOrganization)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-semibold">유형:</span>{' '}
                {getChallengeTypeText(challengeType)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-semibold">시작일:</span>{' '}
                {new Date(startDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-semibold">종료일:</span>{' '}
                {new Date(endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2 dark:text-white">
              챌린지 설명
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {description || '설명이 없습니다.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 챌린지 수정 폼 */}
        <div className="bg-white dark:bg-blue-4 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            챌린지 수정
          </h2>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '챌린지 수정'}
            </button>
          </form>
        </div>

        {/* 참가자 관리 섹션 */}
        <div className="bg-white dark:bg-blue-4 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            참가자 관리
          </h2>

          {/* 참가자 추가 폼 */}
          <form onSubmit={handleAddParticipant} className="mb-6">
            <div className="mb-4">
              <label
                htmlFor="participantEmail"
                className="block mb-2 font-medium dark:text-white"
              >
                참가자 이메일 *
              </label>
              <input
                type="email"
                id="participantEmail"
                value={newParticipantEmail}
                onChange={(e) => setNewParticipantEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
                required
                placeholder="example@email.com"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="participantName"
                className="block mb-2 font-medium dark:text-white"
              >
                참가자 이름 (선택사항)
              </label>
              <input
                type="text"
                id="participantName"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
                placeholder="홍길동"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingParticipant || !newParticipantEmail.trim()}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingParticipant ? '추가 중...' : '참가자 추가'}
            </button>
          </form>

          {/* 참가자 목록 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">
              참가자 목록
            </h3>

            {participants.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                등록된 참가자가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-blue-2">
                  <thead className="bg-gray-50 dark:bg-blue-3">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        이메일
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        이름
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        닉네임
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        등록일
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-blue-4 divide-y divide-gray-200 dark:divide-blue-2">
                    {participants.map((participant) => (
                      <tr key={participant.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {participant.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {participant.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {participant.username || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {participant.created_at
                            ? new Date(
                                participant.created_at
                              ).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            {participant.status === 'active' ? (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                활성
                              </span>
                            ) : (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                비활성
                              </span>
                            )}
                            <button
                              onClick={() =>
                                handleToggleStatus(
                                  participant.id,
                                  participant.status || 'inactive'
                                )
                              }
                              disabled={isUpdatingStatus}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                participant.status === 'active'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100'
                              }`}
                            >
                              {participant.status === 'active'
                                ? '비활성화'
                                : '활성화'}
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteParticipant(participant.id)
                              }
                              disabled={isDeletingParticipant}
                              className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
