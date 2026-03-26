'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Title from '@/components/layout/title';
import {
 Calendar,
 Building2,
 ImageIcon,
 Save,
 Upload,
 X,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

interface Organization {
 id: string;
 name: string;
}

const challengeTypeConfig: { [key: string]: { label: string; bg: string; text: string } } = {
 diet: { label: '식단', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
 exercise: { label: '운동', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
 diet_and_exercise: { label: '식단 및 운동', bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
 running: { label: '러닝', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
};

export default function ChallengeSettingsPage() {
 const params = useParams();
 const challengeId = params.challengeId as string;
 const queryClient = useQueryClient();

 const [challenge, setChallenge] = useState<Challenge | null>(null);
 const [organizationName, setOrganizationName] = useState('');
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);

 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [bannerImageUrl, setBannerImageUrl] = useState('');
 const [coverImageUrl, setCoverImageUrl] = useState('');
 const [bannerImage, setBannerImage] = useState<File | null>(null);
 const [coverImage, setCoverImage] = useState<File | null>(null);
 const [uploadProgress, setUploadProgress] = useState(0);

 useEffect(() => {
  const fetchData = async () => {
   try {
    setIsLoading(true);
    const [challengeRes, orgRes] = await Promise.all([
     fetch(`/api/challenges/${challengeId}`),
     fetch('/api/organizations'),
    ]);

    if (challengeRes.ok) {
     const data = await challengeRes.json();
     setChallenge(data);
     setTitle(data.title);
     setDescription(data.description || '');
     setBannerImageUrl(data.banner_image_url || '');
     setCoverImageUrl(data.cover_image_url || '');

     if (orgRes.ok) {
      const orgs: Organization[] = await orgRes.json();
      const org = orgs.find((o) => o.id === data.organization_id);
      if (org) setOrganizationName(org.name);
     }
    }
   } catch {
    // Error handling
   } finally {
    setIsLoading(false);
   }
  };

  fetchData();
 }, [challengeId]);

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

 const uploadImage = async (image: File | null, folder: string) => {
  if (!image) return '';

  const fileExt = image.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  try {
   const progressInterval = setInterval(() => {
    setUploadProgress((prev) => {
     if (prev >= 90) {
      clearInterval(progressInterval);
      return prev;
     }
     return prev + 10;
    });
   }, 300);

   const { error } = await supabase.storage
    .from('challenge-images')
    .upload(filePath, image, {
     cacheControl: '3600',
     upsert: false,
    });

   clearInterval(progressInterval);
   setUploadProgress(100);

   if (error) throw error;

   const { data: urlData } = supabase.storage
    .from('challenge-images')
    .getPublicUrl(filePath);

   return urlData.publicUrl;
  } catch {
   alert('이미지 업로드 중 오류가 발생했습니다.');
   return '';
  }
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!challenge) return;

  setIsSaving(true);

  try {
   let bannerUrl = bannerImageUrl;
   let coverUrl = coverImageUrl;

   if (bannerImage) {
    bannerUrl = await uploadImage(bannerImage, 'challenge-banners');
   }
   if (coverImage) {
    coverUrl = await uploadImage(coverImage, 'challenge-covers');
   }

   const response = await fetch(`/api/challenges/${challengeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     title,
     description,
     start_date: challenge.start_date,
     end_date: challenge.end_date,
     banner_image_url: bannerUrl,
     cover_image_url: coverUrl,
     challenge_type: challenge.challenge_type,
     organization_id: challenge.organization_id,
    }),
   });

   if (!response.ok) {
    throw new Error('챌린지 수정에 실패했습니다.');
   }

   const updatedChallenge = await response.json();
   setChallenge(updatedChallenge);
   setBannerImageUrl(bannerUrl);
   setCoverImageUrl(coverUrl);
   setBannerImage(null);
   setCoverImage(null);

   queryClient.invalidateQueries({ queryKey: ['challenges'] });

   alert('설정이 저장되었습니다.');
  } catch {
   alert('챌린지 수정 중 오류가 발생했습니다.');
  } finally {
   setIsSaving(false);
   setUploadProgress(0);
  }
 };

 const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
   year: 'numeric',
   month: 'long',
   day: 'numeric',
  });
 };

 if (isLoading) {
  return (
   <div className="min-h-screen p-8 sm:p-4">
    <div className="max-w-5xl mx-auto sm:max-w-none">
     <div className="animate-pulse space-y-8 sm:space-y-4">
      <div>
       <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/6 sm:w-1/3 mb-2"></div>
       <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 sm:w-1/2"></div>
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-700 sm:hidden"></div>
      <div className="grid grid-cols-[240px_1fr] gap-12 sm:grid-cols-1 sm:gap-4">
       <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
       <div className="flex gap-3 sm:flex-col">
        {[1, 2, 3].map((i) => (
         <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1"></div>
        ))}
       </div>
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-700 sm:hidden"></div>
      <div className="grid grid-cols-[240px_1fr] gap-12 sm:grid-cols-1 sm:gap-4">
       <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
       <div className="space-y-4">
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
       </div>
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-700 sm:hidden"></div>
      <div className="grid grid-cols-[240px_1fr] gap-12 sm:grid-cols-1 sm:gap-4">
       <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
       <div className="grid grid-cols-2 gap-6 sm:grid-cols-1">
        <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
       </div>
      </div>
     </div>
    </div>
   </div>
  );
 }

 if (!challenge) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <p className="text-slate-600 dark:text-slate-300 font-medium">챌린지를 찾을 수 없습니다</p>
    </div>
   </div>
  );
 }

 const typeConfig = challengeTypeConfig[challenge.challenge_type] || challengeTypeConfig.diet_and_exercise;

 return (
  <div className="min-h-screen pb-12 sm:pb-28">
   <div className="max-w-5xl mx-auto p-8 sm:max-w-none sm:p-4">
    {/* Header */}
    <div className="mb-10 sm:mb-5">
     <Title title="설정" subtitle="챌린지 기본 정보를 관리합니다" />
    </div>

    <form onSubmit={handleSubmit}>
     {/* ── Section 1: Challenge Info (read-only) ── */}
     <div className="grid grid-cols-[240px_1fr] gap-12 py-8 border-t border-slate-200 dark:border-slate-800 sm:grid-cols-1 sm:gap-3 sm:py-0 sm:border-t-0 sm:mb-5">
      {/* Left: section description */}
      <div className="sm:mb-1">
       <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-xs sm:font-semibold sm:text-slate-400 sm:dark:text-slate-500 sm:uppercase sm:tracking-wider">
        챌린지 정보
       </h3>
       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 sm:hidden">
        챌린지의 기본 정보입니다
       </p>
      </div>

      {/* Right: content */}
      <div className="flex gap-3 sm:flex-col sm:gap-2">
       <div className="flex-1 bg-surface rounded-xl border border-slate-100 dark:border-slate-800 p-4 sm:rounded-xl sm:p-3.5 sm:flex sm:items-center sm:justify-between">
        <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1 sm:mb-0 sm:text-xs">조직</span>
        <div className="flex items-center gap-2">
         <Building2 className="w-4 h-4 text-slate-400 sm:hidden" />
         <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
          {organizationName || '-'}
         </span>
        </div>
       </div>

       <div className="flex-1 bg-surface rounded-xl border border-slate-100 dark:border-slate-800 p-4 sm:rounded-xl sm:p-3.5 sm:flex sm:items-center sm:justify-between">
        <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1 sm:mb-0 sm:text-xs">유형</span>
        <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
         {typeConfig.label}
        </span>
       </div>

       <div className="flex-1 bg-surface rounded-xl border border-slate-100 dark:border-slate-800 p-4 sm:rounded-xl sm:p-3.5 sm:flex sm:items-center sm:justify-between">
        <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1 sm:mb-0 sm:text-xs">기간</span>
        <div className="flex items-center gap-1.5">
         <Calendar className="w-3.5 h-3.5 text-slate-400 sm:hidden" />
         <span className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:text-xs">
          {formatDate(challenge.start_date)} ~ {formatDate(challenge.end_date)}
         </span>
        </div>
       </div>
      </div>
     </div>

     {/* ── Section 2: Basic Settings ── */}
     <div className="grid grid-cols-[240px_1fr] gap-12 py-8 border-t border-slate-200 dark:border-slate-800 sm:grid-cols-1 sm:gap-3 sm:py-0 sm:border-t-0 sm:mb-5">
      <div className="sm:mb-1">
       <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-xs sm:font-semibold sm:text-slate-400 sm:dark:text-slate-500 sm:uppercase sm:tracking-wider">
        기본 설정
       </h3>
       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 sm:hidden">
        챌린지 제목과 설명을 수정합니다
       </p>
      </div>

      <div className="space-y-5 sm:space-y-4">
       <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 sm:text-xs sm:mb-1.5">
         챌린지 제목
        </label>
        <input
         type="text"
         value={title}
         onChange={(e) => setTitle(e.target.value)}
         className="w-full px-4 py-3 bg-surface border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all text-sm sm:px-3.5 sm:py-2.5 sm:rounded-lg sm:text-base"
         placeholder="챌린지 제목을 입력하세요"
        />
       </div>

       <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 sm:text-xs sm:mb-1.5">
         챌린지 설명
        </label>
        <textarea
         value={description}
         onChange={(e) => setDescription(e.target.value)}
         className="w-full px-4 py-3 bg-surface border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none text-sm sm:px-3.5 sm:py-2.5 sm:rounded-lg sm:text-base"
         rows={4}
         placeholder="챌린지에 대한 설명을 입력하세요"
        />
       </div>
      </div>
     </div>

     {/* ── Section 3: Images ── */}
     <div className="grid grid-cols-[240px_1fr] gap-12 py-8 border-t border-slate-200 dark:border-slate-800 sm:grid-cols-1 sm:gap-3 sm:py-0 sm:border-t-0 sm:mb-5">
      <div className="sm:mb-1">
       <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-xs sm:font-semibold sm:text-slate-400 sm:dark:text-slate-500 sm:uppercase sm:tracking-wider">
        이미지
       </h3>
       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 sm:hidden">
        커버와 배너 이미지를 설정합니다
       </p>
      </div>

      <div>
       <div className="grid grid-cols-2 gap-6 sm:grid-cols-1 sm:gap-5">
        {/* Cover Image */}
        <div>
         <div className="flex items-baseline justify-between mb-2 sm:mb-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:text-xs">
           커버 이미지
          </label>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">1:1</span>
         </div>
         <div className="relative group">
          {coverImageUrl || coverImage ? (
           <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 sm:rounded-lg">
            <Image
             src={coverImage ? URL.createObjectURL(coverImage) : coverImageUrl}
             alt="커버 이미지"
             fill
             style={{ objectFit: 'cover' }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center sm:hidden">
             <label className="cursor-pointer text-white text-sm font-medium px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors">
              변경
              <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
             </label>
            </div>
            <div className="hidden sm:flex absolute bottom-2 right-2 gap-1.5">
             <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black/50 backdrop-blur-sm rounded-lg active:bg-black/70 min-h-[32px]">
              <Upload className="w-3.5 h-3.5" />
              변경
              <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
             </label>
             {coverImage && (
              <button
               type="button"
               onClick={() => setCoverImage(null)}
               className="flex items-center justify-center w-8 h-8 text-white bg-black/50 backdrop-blur-sm rounded-lg active:bg-black/70"
              >
               <X className="w-3.5 h-3.5" />
              </button>
             )}
            </div>
           </div>
          ) : (
           <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all sm:rounded-lg sm:active:bg-slate-100 dark:sm:active:bg-slate-800/50">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">이미지 업로드</span>
            <span className="text-[11px] text-slate-300 dark:text-slate-600 mt-0.5">클릭하여 선택</span>
            <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
           </label>
          )}
         </div>
        </div>

        {/* Banner Image */}
        <div>
         <div className="flex items-baseline justify-between mb-2 sm:mb-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:text-xs">
           배너 이미지
          </label>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">16:9</span>
         </div>
         <div className="relative group">
          {bannerImageUrl || bannerImage ? (
           <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 sm:rounded-lg">
            <Image
             src={bannerImage ? URL.createObjectURL(bannerImage) : bannerImageUrl}
             alt="배너 이미지"
             fill
             style={{ objectFit: 'cover' }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center sm:hidden">
             <label className="cursor-pointer text-white text-sm font-medium px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors">
              변경
              <input type="file" accept="image/*" onChange={handleBannerImageChange} className="hidden" />
             </label>
            </div>
            <div className="hidden sm:flex absolute bottom-2 right-2 gap-1.5">
             <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black/50 backdrop-blur-sm rounded-lg active:bg-black/70 min-h-[32px]">
              <Upload className="w-3.5 h-3.5" />
              변경
              <input type="file" accept="image/*" onChange={handleBannerImageChange} className="hidden" />
             </label>
             {bannerImage && (
              <button
               type="button"
               onClick={() => setBannerImage(null)}
               className="flex items-center justify-center w-8 h-8 text-white bg-black/50 backdrop-blur-sm rounded-lg active:bg-black/70"
              >
               <X className="w-3.5 h-3.5" />
              </button>
             )}
            </div>
           </div>
          ) : (
           <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all sm:rounded-lg sm:active:bg-slate-100 dark:sm:active:bg-slate-800/50">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">이미지 업로드</span>
            <span className="text-[11px] text-slate-300 dark:text-slate-600 mt-0.5">클릭하여 선택</span>
            <input type="file" accept="image/*" onChange={handleBannerImageChange} className="hidden" />
           </label>
          )}
         </div>
        </div>
       </div>

       {/* Upload Progress */}
       {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-5 sm:mt-3">
         <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">업로드 중...</span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{uploadProgress}%</span>
         </div>
         <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
          <div
           className="bg-slate-900 dark:bg-white h-1.5 rounded-full transition-all duration-300"
           style={{ width: `${uploadProgress}%` }}
          />
         </div>
        </div>
       )}
      </div>
     </div>

     {/* ── Desktop Save ── */}
     <div className="flex justify-end pt-8 border-t border-slate-200 dark:border-slate-800 sm:hidden">
      <button
       type="submit"
       disabled={isSaving}
       className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
       <Save className="w-4 h-4" />
       {isSaving ? '저장 중...' : '저장'}
      </button>
     </div>

     {/* ── Mobile Sticky Save ── */}
     <div className="hidden sm:block fixed bottom-0 left-0 right-0 z-30 bg-surface/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-3 safe-area-inset-bottom">
      <button
       type="submit"
       disabled={isSaving}
       className="w-full flex items-center justify-center gap-2 px-5 py-3 text-base font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] active:bg-slate-800 dark:active:bg-slate-100"
      >
       <Save className="w-5 h-5" />
       {isSaving ? '저장 중...' : '저장'}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
}
