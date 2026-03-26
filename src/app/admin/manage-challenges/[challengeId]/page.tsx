'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Title from '@/components/layout/title';
import {
 ArrowLeft,
 Calendar,
 Building2,
 Users,
 ImageIcon,
 Save,
 UserPlus,
 Trash2,
 ToggleLeft,
 ToggleRight,
 ChevronUp,
 ChevronDown,
 ChevronsUpDown,
 Mail,
 User,
 Pencil,
 X,
 Plus,
 BarChart3,
 Shield,
 ChevronDown as ChevronDownIcon,
} from 'lucide-react';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Organization {
 id: string;
 name: string;
}

interface LeaderboardMetricConfig {
 metric: string;
 period: string;
}

interface LeaderboardConfig {
 metrics: LeaderboardMetricConfig[];
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
 leaderboard_config?: LeaderboardConfig | null;
}

const METRIC_OPTIONS: { value: string; label: string }[] = [
 { value: 'distance', label: '거리 (km)' },
 { value: 'points', label: '운동량 (pt)' },
 { value: 'durationSeconds', label: '운동 시간' },
 { value: 'workoutCount', label: '운동 횟수' },
 { value: 'calories', label: '칼로리 (kcal)' },
 { value: 'race', label: '레이스' },
];

const PERIOD_OPTIONS: { value: string; label: string }[] = [
 { value: 'weekly', label: '주간' },
 { value: 'monthly', label: '월간' },
 { value: 'total', label: '전체' },
];

interface Participant {
 id: string;
 email: string;
 name?: string;
 username?: string;
 created_at: string;
 status?: string;
}

interface ChallengeCoach {
 id: string;
 coach_id: string;
 username: string;
 email: string;
}

const challengeTypeConfig: { [key: string]: { label: string; bg: string; text: string } } = {
 diet: { label: '식단', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
 exercise: { label: '운동', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
 diet_and_exercise: { label: '식단 및 운동', bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
 running: { label: '러닝', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
};

export default function ChallengeDetail({
 params,
}: {
 params: Promise<{ challengeId: string }>;
}) {
 const { challengeId } = use(params);
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
 const [sortBy, setSortBy] = useState<'email' | 'name' | 'username' | 'created_at'>('created_at');
 const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
 const [isSaving, setIsSaving] = useState(false);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [leaderboardMetrics, setLeaderboardMetrics] = useState<LeaderboardMetricConfig[]>([]);
 const [newMetric, setNewMetric] = useState('points');
 const [newPeriod, setNewPeriod] = useState('total');
 const [challengeCoaches, setChallengeCoaches] = useState<ChallengeCoach[]>([]);
 const [orgCoaches, setOrgCoaches] = useState<{ id: string; username: string; email: string }[]>([]);
 const [selectedCoachId, setSelectedCoachId] = useState('');
 const [manualCoachEmail, setManualCoachEmail] = useState('');
 const [isAddingCoach, setIsAddingCoach] = useState(false);
 const [isCoachDropdownOpen, setIsCoachDropdownOpen] = useState(false);
 const coachDropdownRef = useRef<HTMLDivElement>(null);
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
 setLeaderboardMetrics(data.leaderboard_config?.metrics || []);
 }
 } catch (error) {
 // Error handling
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
 // Error handling
 }
 };

 fetchOrganizations();
 }, []);

 // 참가자 목록 가져오기
 useEffect(() => {
 const fetchParticipants = async () => {
 try {
 const response = await fetch(
 `/api/challenge-participants?challenge_id=${challengeId}&limit=1000`
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
 status: participant.status || 'dropped',
 }))
 );
 }
 } catch (error) {
 // Error handling
 }
 };

 if (challengeId) {
 fetchParticipants();
 }
 }, [challengeId]);

 // 담당 코치 목록 가져오기
 useEffect(() => {
 const fetchChallengeCoaches = async () => {
 try {
 const { data, error } = await supabase
 .from('challenge_coaches')
 .select(`
 id,
 coach_id,
 coaches!coach_id (
  admin_users!admin_user_id (
  username,
  email
  )
 )
 `)
 .eq('challenge_id', challengeId);

 if (error) return;

 setChallengeCoaches(
 (data || []).map((item: any) => {
  const adminUser = Array.isArray(item.coaches?.admin_users)
  ? item.coaches.admin_users[0]
  : item.coaches?.admin_users;
  return {
  id: item.id,
  coach_id: item.coach_id,
  username: adminUser?.username || '',
  email: adminUser?.email || '',
  };
 })
 );
 } catch {
 // Error handling
 }
 };

 if (challengeId) fetchChallengeCoaches();
 }, [challengeId]);

 // 조직 소속 코치 목록 가져오기
 useEffect(() => {
 if (!selectedOrganization) return;
 const fetchOrgCoaches = async () => {
 try {
 const res = await fetch(`/api/organizations/${selectedOrganization}/coaches`);
 if (res.ok) {
  const data = await res.json();
  setOrgCoaches(data.map((c: any) => ({
  id: c.id,
  username: c.username || '',
  email: c.email || '',
  })));
 }
 } catch {
 // Error handling
 }
 };
 fetchOrgCoaches();
 }, [selectedOrganization]);

 // 담당 코치 추가
 const handleAddCoach = async () => {
 if (!selectedCoachId) return;

 setIsAddingCoach(true);
 try {
 // 이미 등록된 코치인지 확인
 if (challengeCoaches.some((c) => c.coach_id === selectedCoachId)) {
 alert('이미 이 챌린지에 등록된 코치입니다.');
 return;
 }

 const { data: newEntry, error } = await supabase
 .from('challenge_coaches')
 .insert({ coach_id: selectedCoachId, challenge_id: challengeId })
 .select()
 .single();

 if (error) {
 alert('코치 추가에 실패했습니다.');
 return;
 }

 const selectedCoach = orgCoaches.find((c) => c.id === selectedCoachId);
 setChallengeCoaches((prev) => [
 ...prev,
 {
  id: newEntry.id,
  coach_id: selectedCoachId,
  username: selectedCoach?.username || '',
  email: selectedCoach?.email || '',
 },
 ]);
 setSelectedCoachId('');
 } catch {
 alert('코치 추가 중 오류가 발생했습니다.');
 } finally {
 setIsAddingCoach(false);
 }
 };

 // 이메일로 직접 코치 추가
 const handleAddCoachByEmail = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!manualCoachEmail.trim()) return;

 setIsAddingCoach(true);
 try {
 const { data: adminUser } = await supabase
 .from('admin_users')
 .select('id')
 .eq('email', manualCoachEmail.trim())
 .single();

 if (!adminUser) {
 alert('해당 이메일의 관리자를 찾을 수 없습니다.');
 return;
 }

 const { data: coach } = await supabase
 .from('coaches')
 .select('id')
 .eq('admin_user_id', adminUser.id)
 .single();

 if (!coach) {
 alert('해당 관리자는 코치로 등록되어 있지 않습니다.');
 return;
 }

 if (challengeCoaches.some((c) => c.coach_id === coach.id)) {
 alert('이미 이 챌린지에 등록된 코치입니다.');
 return;
 }

 const { data: newEntry, error } = await supabase
 .from('challenge_coaches')
 .insert({ coach_id: coach.id, challenge_id: challengeId })
 .select()
 .single();

 if (error) {
 alert('코치 추가에 실패했습니다.');
 return;
 }

 setChallengeCoaches((prev) => [
 ...prev,
 {
  id: newEntry.id,
  coach_id: coach.id,
  username: manualCoachEmail.split('@')[0],
  email: manualCoachEmail.trim(),
 },
 ]);
 setManualCoachEmail('');
 } catch {
 alert('코치 추가 중 오류가 발생했습니다.');
 } finally {
 setIsAddingCoach(false);
 }
 };

 // 담당 코치 삭제
 const handleRemoveCoach = async (coachEntry: ChallengeCoach) => {
 if (!confirm(`${coachEntry.email} 코치를 이 챌린지에서 제거하시겠습니까?`)) return;

 const { error } = await supabase
 .from('challenge_coaches')
 .delete()
 .eq('id', coachEntry.id);

 if (error) {
 alert('코치 제거에 실패했습니다.');
 return;
 }

 setChallengeCoaches((prev) => prev.filter((c) => c.id !== coachEntry.id));
 };

 // 코치 드롭다운 외부 클릭 닫기
 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (coachDropdownRef.current && !coachDropdownRef.current.contains(e.target as Node)) {
 setIsCoachDropdownOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // ESC 키로 모달 닫기
 useEffect(() => {
 const handleEsc = (e: KeyboardEvent) => {
 if (e.key === 'Escape') setIsEditModalOpen(false);
 };
 if (isEditModalOpen) {
 document.addEventListener('keydown', handleEsc);
 document.body.style.overflow = 'hidden';
 }
 return () => {
 document.removeEventListener('keydown', handleEsc);
 document.body.style.overflow = 'unset';
 };
 }, [isEditModalOpen]);

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
 } catch (error) {
 alert('이미지 업로드 중 오류가 발생했습니다.');
 return '';
 }
 };

 // 챌린지 수정 제출 핸들러
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
 leaderboard_config: leaderboardMetrics.length > 0
 ? { metrics: leaderboardMetrics }
 : null,
 }),
 });

 if (!response.ok) {
 throw new Error('챌린지 수정에 실패했습니다.');
 }

 const updatedChallenge = await response.json();
 setChallenge(updatedChallenge);
 setBannerImageUrl(bannerUrl);
 setCoverImageUrl(coverUrl);
 setIsEditModalOpen(false);
 setBannerImage(null);
 setCoverImage(null);
 } catch (error) {
 alert('챌린지 수정 중 오류가 발생했습니다.');
 } finally {
 setIsSaving(false);
 setUploadProgress(0);
 }
 };

 // 참가자 상태 토글 핸들러
 const handleToggleStatus = async (
 participantId: string,
 currentStatus: string
 ) => {
 const newStatus = currentStatus === 'active' ? 'dropped' : 'active';
 const confirmMessage =
 newStatus === 'active'
 ? '이 참가자를 활성화하시겠습니까?'
 : '이 참가자를 비활성화하시겠습니까?';

 if (!confirm(confirmMessage)) {
 return;
 }

 setIsUpdatingStatus(true);

 try {
 const response = await fetch('/api/challenge-participants', {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 participantId,
 status: newStatus,
 }),
 });

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.error || '참가자 상태 변경에 실패했습니다.');
 }

 setParticipants(
 participants.map((p) =>
 p.id === participantId ? { ...p, status: newStatus } : p
 )
 );
 } catch (error) {
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

 setParticipants(participants.filter((p) => p.id !== participantId));
 } catch (error) {
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

 setParticipants([
 ...participants,
 {
 id: newParticipantData.id,
 email: newParticipantData.user_info.email,
 name: newParticipantData.user_info.name || '',
 username: newParticipantData.user_info.username || '',
 created_at: new Date().toISOString(),
 status: 'dropped',
 },
 ]);

 setNewParticipantEmail('');
 setNewParticipantName('');
 } catch (error) {
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

 // 정렬 핸들러
 const handleSort = (field: 'email' | 'name' | 'username' | 'created_at') => {
 if (sortBy === field) {
 setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
 } else {
 setSortBy(field);
 setSortOrder('asc');
 }
 };

 // 정렬 아이콘 렌더링
 const renderSortIcon = (field: 'email' | 'name' | 'username' | 'created_at') => {
 if (sortBy !== field) {
 return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />;
 }
 return sortOrder === 'asc' ? (
 <ChevronUp className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
 ) : (
 <ChevronDown className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
 );
 };

 // 정렬된 참가자 목록
 const sortedParticipants = [...participants].sort((a, b) => {
 let aValue: string | number = a[sortBy] || '';
 let bValue: string | number = b[sortBy] || '';

 if (sortBy === 'created_at') {
 aValue = new Date(aValue).getTime();
 bValue = new Date(bValue).getTime();
 } else {
 aValue = String(aValue).toLowerCase();
 bValue = String(bValue).toLowerCase();
 }

 if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
 if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
 return 0;
 });

 const formatDate = (dateString: string) => {
 const date = new Date(dateString);
 return date.toLocaleDateString('ko-KR', {
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 });
 };

 const activeCount = participants.filter(p => p.status === 'active').length;

 if (isLoading) {
 return (
 <div className="min-h-screen p-8">
 <div className="max-w-7xl mx-auto">
 <div className="animate-pulse space-y-6">
 <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
 <div className="h-48 bg-slate-200 rounded-xl"></div>
 <div className="h-96 bg-slate-200 rounded-xl"></div>
 </div>
 </div>
 </div>
 );
 }

 if (!challenge) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center">
 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Calendar className="w-8 h-8 text-slate-400" />
 </div>
 <p className="text-slate-600 dark:text-slate-300 font-medium">챌린지를 찾을 수 없습니다</p>
 <button
 onClick={() => router.push('/admin/manage-challenges')}
 className="mt-4 text-slate-900 dark:text-white font-medium text-sm hover:underline"
 >
 목록으로 돌아가기 →
 </button>
 </div>
 </div>
 );
 }

 const typeConfig = challengeTypeConfig[challengeType] || challengeTypeConfig.diet_and_exercise;

 return (
 <div className="min-h-screen">
 <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
 {/* Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
 <div className="flex items-center gap-3 sm:gap-4">
 <button
 onClick={() => router.push('/admin/manage-challenges')}
 className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
 >
 <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
 </button>
 <div>
 <Title title="챌린지 관리" />
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
 챌린지 정보를 수정하고 참가자를 관리합니다
 </p>
 </div>
 </div>
 </div>

 {/* Challenge Info Card */}
 <div className="bg-surface rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden mb-6 sm:mb-8">
 <div className="p-4 sm:p-6">
 {/* 제목 + 수정 버튼 */}
 <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
 <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{title}</h1>
 <button
 onClick={() => setIsEditModalOpen(true)}
 className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
 >
 <Pencil className="w-4 h-4" />
 <span className="hidden sm:inline">수정</span>
 </button>
 </div>

 {/* 설명 */}
 {description && (
 <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-4 line-clamp-2">{description}</p>
 )}

 {/* 메타 정보 + 통계 */}
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
 {/* 메타 정보 */}
 <div className="flex flex-wrap items-center gap-2 sm:gap-3">
 <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
 {typeConfig.label}
 </span>
 <span className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5">
 <Building2 className="w-4 h-4" />
 {getOrganizationName(selectedOrganization)}
 </span>
 <span className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5">
 <Calendar className="w-4 h-4" />
 {formatDate(startDate)} - {formatDate(endDate)}
 </span>
 </div>

 {/* Stats */}
 <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
 <div className="text-center">
 <p className="text-xl sm:text-2xl font-bold text-slate-900">{participants.length}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400">전체</p>
 </div>
 <div className="text-center">
 <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400">활성</p>
 </div>
 <div className="text-center">
 <p className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500">{participants.length - activeCount}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400">비활성</p>
 </div>
 <div className="text-center">
 <p className="text-xl sm:text-2xl font-bold text-slate-900">
 {participants.length > 0 ? Math.round((activeCount / participants.length) * 100) : 0}%
 </p>
 <p className="text-xs text-slate-500 dark:text-slate-400">활성화율</p>
 </div>
 </div>
 </div>

 {/* 이미지 미리보기 */}
 {(coverImageUrl || bannerImageUrl) && (
 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
 {/* 커버 이미지 */}
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">커버 이미지 (1:1)</p>
 {coverImageUrl ? (
 <div className="relative aspect-square overflow-hidden border border-slate-200 bg-slate-100">
 <Image
 src={coverImageUrl}
 alt="커버 이미지"
 fill
 style={{ objectFit: 'cover' }}
 />
 </div>
 ) : (
 <div className="flex items-center justify-center aspect-square border border-dashed border-slate-200 bg-slate-50/50">
 <span className="text-xs text-slate-400">이미지 없음</span>
 </div>
 )}
 </div>

 {/* 배너 이미지 */}
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">배너 이미지 (16:9)</p>
 {bannerImageUrl ? (
 <div className="relative aspect-video overflow-hidden border border-slate-200 bg-slate-100">
 <Image
 src={bannerImageUrl}
 alt="배너 이미지"
 fill
 style={{ objectFit: 'cover' }}
 />
 </div>
 ) : (
 <div className="flex items-center justify-center aspect-video border border-dashed border-slate-200 bg-slate-50/50">
 <span className="text-xs text-slate-400">이미지 없음</span>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>

 {/* 담당 코치 관리 */}
 <div className="bg-surface rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden mb-6 sm:mb-8">
 <div className="p-4 sm:p-6 border-b border-slate-100">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
 <Shield className="w-5 h-5 text-slate-400" />
 담당 코치
 </h2>
 </div>

 {/* 코치 추가 */}
 <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 space-y-3">
 {/* 커스텀 드롭다운: 조직 소속 코치 */}
 <div ref={coachDropdownRef} className="relative">
 <button
  type="button"
  onClick={() => setIsCoachDropdownOpen(!isCoachDropdownOpen)}
  className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-slate-200 rounded-xl text-sm text-slate-900 dark:text-white hover:border-slate-300 transition-all"
 >
  {selectedCoachId ? (
  (() => {
   const c = orgCoaches.find((oc) => oc.id === selectedCoachId);
   return c ? (
   <span className="flex items-center gap-2 truncate">
    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 flex-shrink-0">
    {(c.username || c.email)[0].toUpperCase()}
    </span>
    <span className="font-medium truncate">{c.username || c.email}</span>
    {c.username && <span className="text-slate-400 dark:text-slate-500 truncate hidden sm:inline">{c.email}</span>}
   </span>
   ) : <span className="text-slate-400">코치를 선택하세요</span>;
  })()
  ) : (
  <span className="text-slate-400">조직 소속 코치 선택</span>
  )}
  <ChevronDownIcon className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isCoachDropdownOpen ? 'rotate-180' : ''}`} />
 </button>

 {isCoachDropdownOpen && (
  <div className="absolute z-20 mt-1.5 w-full bg-surface border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
  <div className="max-h-48 overflow-y-auto py-1">
   {orgCoaches
   .filter((oc) => !challengeCoaches.some((cc) => cc.coach_id === oc.id))
   .length === 0 ? (
   <div className="px-4 py-3 text-sm text-slate-400 text-center">추가 가능한 코치가 없습니다</div>
   ) : (
   orgCoaches
    .filter((oc) => !challengeCoaches.some((cc) => cc.coach_id === oc.id))
    .map((coach) => (
    <button
    key={coach.id}
    type="button"
    onClick={() => {
     setSelectedCoachId(coach.id);
     setIsCoachDropdownOpen(false);
    }}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
     selectedCoachId === coach.id ? 'bg-slate-50 dark:bg-slate-800' : ''
    }`}
    >
    <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
     {(coach.username || coach.email)[0].toUpperCase()}
    </span>
    <div className="min-w-0 flex-1">
     <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{coach.username || coach.email}</p>
     {coach.username && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{coach.email}</p>}
    </div>
    </button>
    ))
   )}
  </div>
  </div>
 )}
 </div>

 <button
 type="button"
 onClick={handleAddCoach}
 disabled={isAddingCoach || !selectedCoachId}
 className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Plus className="w-4 h-4" />
 {isAddingCoach ? '추가 중...' : '선택한 코치 추가'}
 </button>

 {/* 구분선 */}
 <div className="flex items-center gap-3">
 <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
 <span className="text-xs text-slate-400 dark:text-slate-500">또는</span>
 <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
 </div>

 {/* 직접 입력: 이메일 */}
 <form onSubmit={handleAddCoachByEmail} className="flex gap-3">
 <div className="relative flex-1">
  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
  <input
  type="email"
  value={manualCoachEmail}
  onChange={(e) => setManualCoachEmail(e.target.value)}
  className="w-full pl-11 pr-4 py-3 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all text-sm"
  placeholder="이메일로 직접 추가"
  required
  />
 </div>
 <button
  type="submit"
  disabled={isAddingCoach || !manualCoachEmail.trim()}
  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
 >
  <Plus className="w-4 h-4" />
  추가
 </button>
 </form>
 </div>

 {/* 코치 목록 */}
 <div className="divide-y divide-slate-100 dark:divide-gray-700">
 {challengeCoaches.length === 0 ? (
 <div className="text-center py-8">
 <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
 <p className="text-slate-500 dark:text-slate-400 text-sm">등록된 담당 코치가 없습니다</p>
 </div>
 ) : (
 challengeCoaches.map((coach) => (
  <div key={coach.id} className="flex items-center justify-between px-4 sm:px-6 py-3">
  <div>
  <p className="text-sm font-medium text-slate-900 dark:text-white">{coach.email}</p>
  {coach.username && (
  <p className="text-xs text-slate-500 dark:text-slate-400">{coach.username}</p>
  )}
  </div>
  <button
  onClick={() => handleRemoveCoach(coach)}
  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
  title="제거"
  >
  <Trash2 className="w-4 h-4" />
  </button>
  </div>
 ))
 )}
 </div>
 </div>

 {/* 참가자 관리 */}
 <div className="bg-surface rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
 <div className="p-4 sm:p-6 border-b border-slate-100">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
 <Users className="w-5 h-5 text-slate-400" />
 참가자 관리
 </h2>
 </div>

 {/* 참가자 추가 폼 */}
 <form onSubmit={handleAddParticipant} className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50/50">
 <div className="flex flex-row sm:flex-col gap-3">
 <div className="relative flex-1">
 <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="email"
 value={newParticipantEmail}
 onChange={(e) => setNewParticipantEmail(e.target.value)}
 className="w-full pl-11 pr-4 py-3 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all"
 placeholder="이메일 주소 *"
 required
 />
 </div>
 <div className="relative flex-1 lg:max-w-[200px]">
 <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="text"
 value={newParticipantName}
 onChange={(e) => setNewParticipantName(e.target.value)}
 className="w-full pl-11 pr-4 py-3 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all"
 placeholder="이름 (선택)"
 />
 </div>
 <button
 type="submit"
 disabled={isAddingParticipant || !newParticipantEmail.trim()}
 className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
 >
 <UserPlus className="w-4 h-4" />
 {isAddingParticipant ? '추가 중...' : '참가자 추가'}
 </button>
 </div>
 </form>

 {/* 참가자 목록 */}
 <div className="max-h-[500px] overflow-y-auto">
 {participants.length === 0 ? (
 <div className="text-center py-12">
 <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Users className="w-7 h-7 text-slate-400" />
 </div>
 <p className="text-slate-600 dark:text-slate-300 font-medium">등록된 참가자가 없습니다</p>
 <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">위 폼에서 참가자를 추가해보세요</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="sticky top-0 bg-slate-50/50 border-b border-slate-200">
 <tr className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
 <th className="px-4 py-3 text-center w-12">#</th>
 <th className="px-4 py-3 text-left">
 <button
 onClick={() => handleSort('email')}
 className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
 >
 이메일 {renderSortIcon('email')}
 </button>
 </th>
 <th className="px-4 py-3 text-left w-32">
 <button
 onClick={() => handleSort('name')}
 className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
 >
 이름 {renderSortIcon('name')}
 </button>
 </th>
 <th className="px-4 py-3 text-left w-32">
 <button
 onClick={() => handleSort('username')}
 className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
 >
 닉네임 {renderSortIcon('username')}
 </button>
 </th>
 <th className="px-4 py-3 text-left w-28">
 <button
 onClick={() => handleSort('created_at')}
 className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
 >
 등록일 {renderSortIcon('created_at')}
 </button>
 </th>
 <th className="px-4 py-3 text-right w-40">액션</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
 {sortedParticipants.map((participant, index) => (
 <tr
 key={participant.id}
 className="hover:bg-slate-50/30 transition-colors"
 >
 <td className="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
 {index + 1}
 </td>
 <td className="px-4 py-3">
 <p className="text-sm font-medium text-slate-900">
 {participant.email}
 </p>
 </td>
 <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
 {participant.name || '-'}
 </td>
 <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-500">
 {participant.username ? `@${participant.username}` : '-'}
 </td>
 <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
 {new Date(participant.created_at).toLocaleDateString('ko-KR')}
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center justify-end gap-1.5">
 {participant.status === 'active' ? (
 <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
 활성
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:text-slate-400">
 <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
 비활성
 </span>
 )}
 <button
 onClick={() =>
 handleToggleStatus(
 participant.id,
 participant.status || 'dropped'
 )
 }
 disabled={isUpdatingStatus}
 className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
 title={participant.status === 'active' ? '비활성화' : '활성화'}
 >
 {participant.status === 'active' ? (
 <ToggleRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
 ) : (
 <ToggleLeft className="w-4 h-4 text-slate-400" />
 )}
 </button>
 <button
 onClick={() => handleDeleteParticipant(participant.id)}
 disabled={isDeletingParticipant}
 className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
 title="삭제"
 >
 <Trash2 className="w-4 h-4" />
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

 {/* Edit Modal */}
 {isEditModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
 onClick={() => setIsEditModalOpen(false)}
 />

 {/* Modal */}
 <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 {/* Modal Header */}
 <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
 <h2 className="text-xl font-semibold text-slate-900">챌린지 정보 수정</h2>
 <button
 onClick={() => setIsEditModalOpen(false)}
 className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
 </button>
 </div>

 {/* Modal Body */}
 <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
 <div className="p-4 sm:p-6 space-y-5">
 {/* 조직 & 유형 (읽기 전용) */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 조직
 </label>
 <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-600 dark:text-slate-400 text-sm">
 <Building2 className="w-4 h-4 flex-shrink-0" />
 <span className="truncate">{getOrganizationName(selectedOrganization)}</span>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 유형
 </label>
 <div className="px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl">
 <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
 {typeConfig.label}
 </span>
 </div>
 </div>
 </div>

 {/* 챌린지 제목 */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 챌린지 제목
 </label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all"
 placeholder="챌린지 제목을 입력하세요"
 />
 </div>

 {/* 챌린지 설명 */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 챌린지 설명
 </label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none"
 rows={3}
 placeholder="챌린지에 대한 설명을 입력하세요"
 />
 </div>

 {/* 날짜 */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 시작일
 </label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white transition-all"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 종료일
 </label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent text-slate-900 dark:text-white transition-all"
 />
 </div>
 </div>

 {/* 리더보드 메트릭 설정 */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 <BarChart3 className="w-4 h-4 inline mr-1.5" />
 리더보드 메트릭
 </label>
 <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
 리더보드에 표시할 메트릭과 기간을 설정합니다. 비어있으면 기본값(운동량/전체)이 사용됩니다.
 </p>

 {/* 현재 설정된 메트릭 태그 */}
 {leaderboardMetrics.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-3">
 {leaderboardMetrics.map((m, index) => {
 const metricLabel = METRIC_OPTIONS.find(o => o.value === m.metric)?.label || m.metric;
 const periodLabel = PERIOD_OPTIONS.find(o => o.value === m.period)?.label || m.period;
 return (
 <span
 key={`${m.metric}-${m.period}-${index}`}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
 >
 {metricLabel} · {periodLabel}
 <button
 type="button"
 onClick={() => {
 setLeaderboardMetrics(prev => prev.filter((_, i) => i !== index));
 }}
 className="ml-0.5 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
 >
 <X className="w-3 h-3" />
 </button>
 </span>
 );
 })}
 </div>
 )}

 {/* 메트릭 추가 UI */}
 <div className="flex items-center gap-2">
 <select
 value={newMetric}
 onChange={(e) => setNewMetric(e.target.value)}
 className="flex-1 px-3 py-2 bg-surface border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white text-sm text-slate-900 dark:text-white"
 >
 {METRIC_OPTIONS.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 <select
 value={newPeriod}
 onChange={(e) => setNewPeriod(e.target.value)}
 className="flex-1 px-3 py-2 bg-surface border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white text-sm text-slate-900 dark:text-white"
 >
 {PERIOD_OPTIONS.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 <button
 type="button"
 onClick={() => {
 const exists = leaderboardMetrics.some(
 m => m.metric === newMetric && m.period === newPeriod
 );
 if (!exists) {
 setLeaderboardMetrics(prev => [...prev, { metric: newMetric, period: newPeriod }]);
 }
 }}
 className="flex-shrink-0 p-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-colors"
 >
 <Plus className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* 이미지 */}
 <div className="grid grid-cols-2 gap-4">
 {/* 커버 이미지 */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 커버 이미지
 </label>
 <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">1:1 · 썸네일용</p>
 <div className="relative">
 {coverImageUrl || coverImage ? (
 <div className="relative aspect-square overflow-hidden border border-slate-200">
 <Image
 src={coverImage ? URL.createObjectURL(coverImage) : coverImageUrl}
 alt="커버 이미지"
 fill
 style={{ objectFit: 'cover' }}
 />
 <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
 <label className="cursor-pointer text-white text-xs font-medium">
 변경
 <input
 type="file"
 accept="image/*"
 onChange={handleCoverImageChange}
 className="hidden"
 />
 </label>
 </div>
 </div>
 ) : (
 <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 cursor-pointer hover:border-slate-400 dark:hover:border-line-strong transition-colors">
 <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
 <span className="text-xs text-slate-500">이미지 업로드</span>
 <input
 type="file"
 accept="image/*"
 onChange={handleCoverImageChange}
 className="hidden"
 />
 </label>
 )}
 </div>
 </div>

 {/* 배너 이미지 */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 배너 이미지
 </label>
 <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">16:9 · 상세용</p>
 <div className="relative">
 {bannerImageUrl || bannerImage ? (
 <div className="relative aspect-video overflow-hidden border border-slate-200">
 <Image
 src={bannerImage ? URL.createObjectURL(bannerImage) : bannerImageUrl}
 alt="배너 이미지"
 fill
 style={{ objectFit: 'cover' }}
 />
 <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
 <label className="cursor-pointer text-white text-xs font-medium">
 변경
 <input
 type="file"
 accept="image/*"
 onChange={handleBannerImageChange}
 className="hidden"
 />
 </label>
 </div>
 </div>
 ) : (
 <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-200 cursor-pointer hover:border-slate-400 dark:hover:border-line-strong transition-colors">
 <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
 <span className="text-xs text-slate-500">이미지 업로드</span>
 <input
 type="file"
 accept="image/*"
 onChange={handleBannerImageChange}
 className="hidden"
 />
 </label>
 )}
 </div>
 </div>
 </div>

 {uploadProgress > 0 && uploadProgress < 100 && (
 <div className="w-full bg-slate-100 rounded-full h-2">
 <div
 className="bg-slate-900 dark:bg-surface h-2 rounded-full transition-all"
 style={{ width: `${uploadProgress}%` }}
 />
 </div>
 )}
 </div>

 {/* Modal Footer */}
 <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50">
 <button
 type="button"
 onClick={() => setIsEditModalOpen(false)}
 className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
 >
 취소
 </button>
 <button
 type="submit"
 disabled={isSaving}
 className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-surface dark:text-slate-900 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Save className="w-4 h-4" />
 {isSaving ? '저장 중...' : '저장'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
