import type { VerificationStatus, ProgramStatus } from '@/types/daily-program';

export const verificationStatusConfig: Record<VerificationStatus, { label: string; className: string }> = {
 pending:       { label: '대기',     className: 'bg-status-warning-subtle text-status-warning-text' },
 approved:      { label: '승인',     className: 'bg-status-success-subtle text-status-success-text' },
 rejected:      { label: '거부',     className: 'bg-status-error-subtle text-status-error-text' },
 auto_approved: { label: '자동승인', className: 'bg-status-info-subtle text-status-info-text' },
};

export const programStatusConfig: Record<ProgramStatus, { label: string; className: string }> = {
 draft:     { label: '초안', className: 'bg-status-warning-subtle text-status-warning-text' },
 published: { label: '발행', className: 'bg-status-success-subtle text-status-success-text' },
 archived:  { label: '보관', className: 'bg-surface-raised text-content-secondary' },
};

export const statusDotConfig: Record<ProgramStatus, string> = {
 draft:     'bg-status-warning',
 published: 'bg-status-success',
 archived:  'bg-content-disabled',
};
