'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Title from '@/components/layout/title';

interface Organization {
 id: string;
 name: string;
}

interface Challenge {
 id: string;
 challenges?: {
 id: string;
 title: string;
 description: string;
 start_date: string;
 end_date: string;
 banner_image_url: string;
 cover_image_url: string;
 challenge_type: string;
 organization_id: string;
 };
 title?: string;
 description?: string;
 start_date?: string;
 end_date?: string;
 banner_image_url?: string;
 cover_image_url?: string;
 challenge_type?: string;
 organization_id?: string;
}

type ChallengeStatus = 'active' | 'upcoming' | 'ended';

function getChallengeStatus(challenge: Challenge): ChallengeStatus {
 const startStr = challenge.challenges?.start_date || challenge.start_date;
 const endStr = challenge.challenges?.end_date || challenge.end_date;

 const today = new Date();
 today.setHours(0, 0, 0, 0);

 const start = startStr ? new Date(startStr) : null;
 const end = endStr ? new Date(endStr) : null;
 if (start) start.setHours(0, 0, 0, 0);
 if (end) end.setHours(0, 0, 0, 0);

 if (start && end) {
 if (today >= start && today <= end) return 'active';
 if (today < start) return 'upcoming';
 return 'ended';
 }
 if (start && !end) {
 return today >= start ? 'active' : 'upcoming';
 }
 if (!start && end) {
 return today <= end ? 'active' : 'ended';
 }
 return 'ended';
}

const STATUS_ORDER: Record<ChallengeStatus, number> = {
 active: 0,
 upcoming: 1,
 ended: 2,
};

type StatusFilter = 'all' | ChallengeStatus;

export default function ManageChallenges() {
 const [challenges, setChallenges] = useState<Challenge[]>([]);
 const [organizations, setOrganizations] = useState<Organization[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
 const router = useRouter();

 // 챌린지 목록 가져오기
 useEffect(() => {
 const fetchChallenges = async () => {
 try {
 setIsLoading(true);
 const response = await fetch('/api/challenges');
 if (response.ok) {
 const data = await response.json();
 const challengeList = Array.isArray(data) ? data : [];
 setChallenges(challengeList);
 }
 } catch (error) {
// console.error('챌린지 목록 가져오기 오류:', error);
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
// console.error('조직 목록 가져오기 오류:', error);
 }
 };

 fetchOrganizations();
 }, []);

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
 case 'running':
 return '러닝';
 default:
 return '알 수 없음';
 }
 };

 // 상태 카운트 계산
 const statusCounts = useMemo(() => {
 const counts = { all: challenges.length, active: 0, upcoming: 0, ended: 0 };
 for (const c of challenges) {
 counts[getChallengeStatus(c)]++;
 }
 return counts;
 }, [challenges]);

 // 정렬 + 필터링
 const sortedFilteredChallenges = useMemo(() => {
 const filtered = statusFilter === 'all'
 ? challenges
 : challenges.filter((c) => getChallengeStatus(c) === statusFilter);

 return [...filtered].sort((a, b) => {
 const statusDiff = STATUS_ORDER[getChallengeStatus(a)] - STATUS_ORDER[getChallengeStatus(b)];
 if (statusDiff !== 0) return statusDiff;

 const aStart = a.challenges?.start_date || a.start_date || '';
 const bStart = b.challenges?.start_date || b.start_date || '';
 return bStart.localeCompare(aStart); // 내림차순
 });
 }, [challenges, statusFilter]);

 const statusTabs: { key: StatusFilter; label: string }[] = [
 { key: 'all', label: '전체' },
 { key: 'active', label: '진행 중' },
 { key: 'upcoming', label: '예정' },
 { key: 'ended', label: '종료' },
 ];

 const statusBadge = (status: ChallengeStatus) => {
 switch (status) {
 case 'active':
 return (
 <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 진행 중
 </span>
 );
 case 'upcoming':
 return (
 <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
 <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
 예정
 </span>
 );
 case 'ended':
 return (
 <span className="inline-flex items-center gap-1.5 text-xs font-medium text-content-disabled">
 <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
 종료
 </span>
 );
 }
 };

 return (
 <div className="container mx-auto px-6 pt-6 sm:px-4 sm:pt-4">
 <div className="flex justify-between items-center mb-6 sm:mb-4">
 <Title title="챌린지 관리" />
 </div>

 {/* 상태 필터 탭 */}
 <div className="flex gap-1 mb-4">
 {statusTabs.map(({ key, label }) => (
 <button
 key={key}
 onClick={() => setStatusFilter(key)}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 statusFilter === key
 ? 'bg-neutral-900 dark:bg-surface text-white'
 : 'bg-surface-raised text-content-secondary hover:bg-surface-sunken'
 }`}
 >
 {label}
 <span className={`ml-1.5 text-xs ${statusFilter === key ? 'text-content-disabled' : 'text-content-disabled'}`}>
 {statusCounts[key]}
 </span>
 </button>
 ))}
 </div>

 {isLoading || organizations.length === 0 ? (
 <div className="flex justify-center items-center h-64">
 <p className="text-content-tertiary">로딩 중...</p>
 </div>
 ) : challenges.length === 0 ? (
 <div className="bg-surface rounded-lg shadow p-6 text-center">
 <p className="text-content-tertiary">
 등록된 챌린지가 없습니다.
 </p>
 </div>
 ) : sortedFilteredChallenges.length === 0 ? (
 <div className="bg-surface rounded-lg shadow p-6 text-center">
 <p className="text-content-tertiary">
 해당 상태의 챌린지가 없습니다.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {sortedFilteredChallenges.map((challenge) => {
 const status = getChallengeStatus(challenge);
 return (
 <div
 key={challenge.id}
 className={`bg-surface rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${
 status === 'ended' ? 'opacity-60' : ''
 }`}
 onClick={() =>
 router.push(`/admin/manage-challenges/${challenge.challenges?.id || challenge.id}`)
 }
 >
 <div className="h-40 bg-surface-sunken dark:bg-accent-subtle relative">
 {(challenge.challenges?.cover_image_url || challenge.cover_image_url) ? (
 <Image
 src={challenge.challenges?.cover_image_url || challenge.cover_image_url || ''}
 alt={challenge.challenges?.title || challenge.title || ''}
 fill
 style={{ objectFit: 'cover' }}
 />
 ) : (
 <div className="flex items-center justify-center h-full text-content-disabled">
 이미지 없음
 </div>
 )}
 </div>
 <div className="p-4">
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-lg font-semibold">
 {challenge.challenges?.title || challenge.title}
 </h2>
 {statusBadge(status)}
 </div>
 <p className="text-sm text-content-secondary mb-2">
 {(challenge.challenges?.description || challenge.description)
 ? (challenge.challenges?.description || challenge.description || '').length > 100
 ? `${(challenge.challenges?.description || challenge.description || '').substring(0, 100)}...`
 : (challenge.challenges?.description || challenge.description)
 : '설명 없음'}
 </p>
 <div className="text-xs text-content-tertiary">
 <p>조직: {getOrganizationName(challenge.challenges?.organization_id || challenge.organization_id || '')}</p>
 <p>유형: {getChallengeTypeText(challenge.challenges?.challenge_type || challenge.challenge_type || '')}</p>
 <p>
 기간: {new Date(challenge.challenges?.start_date || challenge.start_date || '').toLocaleDateString()}{' '}
 ~ {new Date(challenge.challenges?.end_date || challenge.end_date || '').toLocaleDateString()}
 </p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}
