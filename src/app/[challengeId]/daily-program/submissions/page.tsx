'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { DailyProgramCompletion, VerificationStatus } from '@/types/daily-program';
import { SubmissionTable } from '@/components/daily-program/submission-table';
import { SubmissionReviewDialog } from '@/components/daily-program/submission-review-dialog';
import { useResponsive } from '@/components/hooks/useResponsive';
import Title from '@/components/layout/title';

export default function SubmissionsPage() {
 const params = useParams();
 const challengeId = params.challengeId as string;
 const { isMobile } = useResponsive();

 const [completions, setCompletions] = useState<DailyProgramCompletion[]>([]);
 const [loading, setLoading] = useState(true);
 const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('pending');
 const [reviewTarget, setReviewTarget] = useState<DailyProgramCompletion | null>(null);

 const fetchCompletions = useCallback(async () => {
 setLoading(true);
 try {
 let url = `/api/daily-program-completions?challengeId=${challengeId}`;
 if (statusFilter !== 'all') {
 url += `&status=${statusFilter}`;
 }
 const res = await fetch(url);
 if (res.ok) {
 const data = await res.json();
 setCompletions(data);
 }
 } catch (error) {
 console.error('Failed to fetch completions:', error);
 } finally {
 setLoading(false);
 }
 }, [challengeId, statusFilter]);

 useEffect(() => {
 fetchCompletions();
 }, [fetchCompletions]);

 const handleReview = async (completionId: string, status: 'approved' | 'rejected') => {
 try {
 const res = await fetch('/api/daily-program-completions', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 id: completionId,
 verification_status: status,
 }),
 });
 if (res.ok) {
 setReviewTarget(null);
 fetchCompletions();
 }
 } catch (error) {
 console.error('Failed to review completion:', error);
 }
 };

 const STATUS_OPTIONS: { value: VerificationStatus | 'all'; label: string }[] = [
 { value: 'all', label: '전체' },
 { value: 'pending', label: '대기' },
 { value: 'approved', label: '승인' },
 { value: 'rejected', label: '거부' },
 { value: 'auto_approved', label: '자동승인' },
 ];

 return (
 <div className="h-full flex flex-col">
 <Title title="제출 관리" subtitle="데일리 프로그램" />

 {/* Filters */}
 <div className="px-4 py-3 border-b border-line flex items-center gap-2 overflow-x-auto">
 {STATUS_OPTIONS.map((opt) => (
 <button
 key={opt.value}
 onClick={() => setStatusFilter(opt.value)}
 className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
 statusFilter === opt.value
 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
 : 'text-content-secondary hover:bg-surface-raised'
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>

 {/* Table */}
 <div className="flex-1 overflow-auto px-4 py-4">
 {loading ? (
 <div className="flex items-center justify-center h-32">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
 </div>
 ) : (
 <SubmissionTable
 completions={completions}
 onReview={setReviewTarget}
 mobile={isMobile}
 />
 )}
 </div>

 {/* Review Dialog */}
 {reviewTarget && (
 <SubmissionReviewDialog
 completion={reviewTarget}
 onClose={() => setReviewTarget(null)}
 onApprove={(id) => handleReview(id, 'approved')}
 onReject={(id) => handleReview(id, 'rejected')}
 />
 )}
 </div>
 );
}
