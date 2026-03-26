'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Title from '@/components/layout/title';

interface Organization {
 id: string;
 name: string;
 description: string | null;
 logo_url: string | null;
}

interface OrganizationMember {
 id: string;
 user_id: string;
 organization_id: string;
 role: string;
 email: string;
 name: string;
}

interface OrganizationCoach {
 id: string;
 admin_user_id: string;
 organization_id: string;
 profile_image_url: string | null;
 username: string;
 email: string;
 admin_role: string;
}

type ModalType = 'editMember' | 'addCoach' | 'addOrg' | null;

interface EditingMember {
 member: OrganizationMember;
 isCoach: boolean;
 coachId: string | null;
}

// ─── 모달 래퍼 ───
function Modal({
 open,
 onClose,
 title,
 children,
}: {
 open: boolean;
 onClose: () => void;
 title: string;
 children: React.ReactNode;
}) {
 useEffect(() => {
 if (!open) return;
 document.body.style.overflow = 'hidden';
 const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape') onClose();
 };
 window.addEventListener('keydown', handleEsc);
 return () => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', handleEsc);
 };
 }, [open, onClose]);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
  <div
  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
  onClick={onClose}
  />
  <div className="relative w-full lg:max-w-md lg:mx-4 bg-surface rounded-t-2xl lg:rounded-xl shadow-xl animate-in fade-in duration-200 max-h-[85vh] flex flex-col">
  <div className="flex items-center justify-between px-5 py-4 border-b border-line">
   <h3 className="text-title font-semibold">{title}</h3>
   <button
   onClick={onClose}
   className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-raised text-content-tertiary"
   >
   ✕
   </button>
  </div>
  <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
  </div>
 </div>
 );
}

// ─── 조직 아바타 ───
function OrgAvatar({ org, size = 40 }: { org: Organization; size?: number }) {
 if (org.logo_url) {
 return (
  <div
  className="rounded-full overflow-hidden flex-shrink-0"
  style={{ width: size, height: size }}
  >
  <Image
   src={org.logo_url}
   alt={org.name}
   width={size}
   height={size}
   className="object-cover"
  />
  </div>
 );
 }
 return (
 <div
  className="rounded-full bg-surface-sunken flex items-center justify-center flex-shrink-0"
  style={{ width: size, height: size }}
 >
  <span
  className="text-content-tertiary font-semibold"
  style={{ fontSize: size * 0.4 }}
  >
  {org.name.charAt(0).toUpperCase()}
  </span>
 </div>
 );
}

// ─── 메인 페이지 ───
export default function ManageOrganizationsPage() {
 const [organizations, setOrganizations] = useState<Organization[]>([]);
 const [selectedOrganization, setSelectedOrganization] =
 useState<Organization | null>(null);
 const [members, setMembers] = useState<OrganizationMember[]>([]);
 const [coaches, setCoaches] = useState<OrganizationCoach[]>([]);
 const [loading, setLoading] = useState(true);
 const [membersLoading, setMembersLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // 모달
 const [activeModal, setActiveModal] = useState<ModalType>(null);
 const closeModal = useCallback(() => setActiveModal(null), []);

 // 편집 모달
 const [editingMember, setEditingMember] = useState<EditingMember | null>(
 null
 );
 const [editCoachValue, setEditCoachValue] = useState(false);
 const [editSaving, setEditSaving] = useState(false);
 const [editError, setEditError] = useState<string | null>(null);

 // 코치 추가 모달
 const [newCoachEmail, setNewCoachEmail] = useState('');
 const [newCoachUsername, setNewCoachUsername] = useState('');
 const [addCoachLoading, setAddCoachLoading] = useState(false);
 const [addCoachError, setAddCoachError] = useState<string | null>(null);

 // 새 조직 모달
 const [newOrganization, setNewOrganization] = useState({
 name: '',
 description: '',
 logo_url: '',
 });
 const [addOrgLoading, setAddOrgLoading] = useState(false);

 // 코치 매핑
 const coachByEmail = useMemo(() => {
 const map = new Map<string, OrganizationCoach>();
 coaches.forEach((c) => map.set(c.email, c));
 return map;
 }, [coaches]);

 // ─── 데이터 로딩 ───
 useEffect(() => {
 const fetchOrganizations = async () => {
  try {
  setLoading(true);
  const res = await fetch('/api/organizations');
  if (!res.ok) throw new Error('조직 데이터를 가져오는데 실패했습니다.');
  const data = await res.json();
  setOrganizations(data);
  if (data.length > 0 && !selectedOrganization) {
   setSelectedOrganization(data[0]);
  }
  } catch (err) {
  setError(
   err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
  );
  } finally {
  setLoading(false);
  }
 };
 fetchOrganizations();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 useEffect(() => {
 if (!selectedOrganization) return;
 const fetchData = async () => {
  setMembersLoading(true);
  try {
  const [membersRes, coachesRes] = await Promise.all([
   fetch(`/api/organizations/${selectedOrganization.id}/members`),
   fetch(`/api/organizations/${selectedOrganization.id}/coaches`),
  ]);
  setMembers(membersRes.ok ? await membersRes.json() : []);
  setCoaches(coachesRes.ok ? await coachesRes.json() : []);
  } catch {
  setMembers([]);
  setCoaches([]);
  } finally {
  setMembersLoading(false);
  }
 };
 fetchData();
 }, [selectedOrganization]);

 // ─── 핸들러 ───
 const handleSelectOrganization = (org: Organization) => {
 setSelectedOrganization(org);
 };

 const handleAddOrganization = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newOrganization.name.trim()) return;
 try {
  setAddOrgLoading(true);
  const res = await fetch('/api/organizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newOrganization),
  });
  if (!res.ok) throw new Error('조직 추가에 실패했습니다.');
  const added = await res.json();
  setOrganizations((prev) => [...prev, added]);
  setSelectedOrganization(added);
  setNewOrganization({ name: '', description: '', logo_url: '' });
  closeModal();
 } catch (err) {
  setError(
  err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
  );
 } finally {
  setAddOrgLoading(false);
 }
 };

 const openEditModal = (member: OrganizationMember) => {
 const coach = coachByEmail.get(member.email);
 setEditingMember({
  member,
  isCoach: !!coach,
  coachId: coach?.id || null,
 });
 setEditCoachValue(!!coach);
 setEditError(null);
 setActiveModal('editMember');
 };

 const handleEditSave = async () => {
 if (!editingMember || !selectedOrganization) return;
 const { isCoach: wasCoach, coachId } = editingMember;
 const willBeCoach = editCoachValue;
 if (wasCoach === willBeCoach) {
  closeModal();
  return;
 }
 try {
  setEditSaving(true);
  setEditError(null);
  if (willBeCoach && !wasCoach) {
  const res = await fetch(
   `/api/organizations/${selectedOrganization.id}/coaches`,
   {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ email: editingMember.member.email }),
   }
  );
  const data = await res.json();
  if (!res.ok) {
   setEditError(data.error || '코치 추가에 실패했습니다.');
   return;
  }
  setCoaches((prev) => [...prev, data]);
  } else if (!willBeCoach && wasCoach && coachId) {
  const res = await fetch(
   `/api/organizations/${selectedOrganization.id}/coaches`,
   {
   method: 'DELETE',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ coach_id: coachId }),
   }
  );
  if (!res.ok) {
   const data = await res.json();
   setEditError(data.error || '코치 해제에 실패했습니다.');
   return;
  }
  setCoaches((prev) => prev.filter((c) => c.id !== coachId));
  }
  closeModal();
 } catch (err) {
  setEditError(
  err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
  );
 } finally {
  setEditSaving(false);
 }
 };

 const handleAddCoach = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedOrganization || !newCoachEmail.trim()) return;
 try {
  setAddCoachLoading(true);
  setAddCoachError(null);
  const res = await fetch(
  `/api/organizations/${selectedOrganization.id}/coaches`,
  {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
   email: newCoachEmail.trim(),
   username: newCoachUsername.trim() || undefined,
   }),
  }
  );
  const data = await res.json();
  if (!res.ok) {
  setAddCoachError(data.error || '코치 추가에 실패했습니다.');
  return;
  }
  setCoaches((prev) => [...prev, data]);
  setNewCoachEmail('');
  setNewCoachUsername('');
  closeModal();
  // 멤버 새로고침
  const membersRes = await fetch(
  `/api/organizations/${selectedOrganization.id}/members`
  );
  if (membersRes.ok) setMembers(await membersRes.json());
 } catch (err) {
  setAddCoachError(
  err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
  );
 } finally {
  setAddCoachLoading(false);
 }
 };

 // ─── 렌더 ───
 return (
 <div className="max-w-7xl mx-auto sm:px-0 sm:py-0 lg:px-4 lg:py-5">
  <Title title="조직 관리" className="sm:px-4 sm:pt-4 lg:px-0 lg:pt-0 mb-6" />

  {error && (
  <div className="mx-4 lg:mx-0 mb-4 bg-status-error-subtle border border-status-error text-status-error-text px-4 py-3 rounded-lg text-sm">
   {error}
   <button
   onClick={() => setError(null)}
   className="float-right text-status-error-text font-bold"
   >
   ✕
   </button>
  </div>
  )}

  {/* ─── 모바일: 조직 선택 드롭다운 ─── */}
  <div className="lg:hidden px-4 mb-4">
  <div className="flex gap-2">
   <select
   value={selectedOrganization?.id || ''}
   onChange={(e) => {
    const org = organizations.find((o) => o.id === e.target.value);
    if (org) handleSelectOrganization(org);
   }}
   className="flex-1 px-3 py-3 bg-surface border border-line rounded-xl text-sm font-medium appearance-none"
   >
   {organizations.map((org) => (
    <option key={org.id} value={org.id}>
    {org.name}
    </option>
   ))}
   </select>
   <button
   onClick={() => {
    setNewOrganization({ name: '', description: '', logo_url: '' });
    setActiveModal('addOrg');
   }}
   className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium whitespace-nowrap"
   >
   + 새 조직
   </button>
  </div>
  {selectedOrganization?.description && (
   <p className="mt-2 text-body-sm text-content-secondary">
   {selectedOrganization.description}
   </p>
  )}
  </div>

  <div className="flex gap-6">
  {/* ─── PC: 조직 목록 사이드패널 ─── */}
  <div className="hidden lg:block w-72 flex-shrink-0">
   <div className="bg-surface rounded-xl border border-line p-4 sticky top-20">
   <div className="flex justify-between items-center mb-4">
    <h2 className="text-title font-semibold">조직 목록</h2>
    <button
    onClick={() => {
     setNewOrganization({ name: '', description: '', logo_url: '' });
     setActiveModal('addOrg');
    }}
    className="text-sm text-accent hover:text-accent-hover font-medium"
    >
    + 추가
    </button>
   </div>

   {loading && organizations.length === 0 ? (
    <div className="py-8 text-center text-content-tertiary text-sm">
    로딩 중...
    </div>
   ) : organizations.length === 0 ? (
    <div className="py-8 text-center text-content-tertiary text-sm">
    등록된 조직이 없습니다.
    </div>
   ) : (
    <ul className="space-y-1">
    {organizations.map((org) => (
     <li
     key={org.id}
     onClick={() => handleSelectOrganization(org)}
     className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
      selectedOrganization?.id === org.id
      ? 'bg-accent-subtle'
      : 'hover:bg-surface-raised'
     }`}
     >
     <OrgAvatar org={org} size={36} />
     <div className="min-w-0">
      <p
      className={`text-sm font-medium truncate ${
       selectedOrganization?.id === org.id
       ? 'text-accent'
       : ''
      }`}
      >
      {org.name}
      </p>
      {org.description && (
      <p className="text-xs text-content-tertiary truncate">
       {org.description}
      </p>
      )}
     </div>
     </li>
    ))}
    </ul>
   )}
   </div>
  </div>

  {/* ─── 메인 콘텐츠 ─── */}
  <div className="flex-1 min-w-0">
   {selectedOrganization ? (
   <>
    {/* PC: 조직 헤더 */}
    <div className="hidden lg:flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
     <OrgAvatar org={selectedOrganization} size={48} />
     <div>
     <h2 className="text-headline-lg font-bold">
      {selectedOrganization.name}
     </h2>
     {selectedOrganization.description && (
      <p className="text-body-sm text-content-secondary mt-0.5">
      {selectedOrganization.description}
      </p>
     )}
     </div>
    </div>
    </div>

    {/* 멤버 헤더 */}
    <div className="flex items-center justify-between px-4 lg:px-0 mb-3">
    <h3 className="text-title font-semibold">
     멤버
     {!membersLoading && (
     <span className="text-content-tertiary font-normal ml-2 text-sm">
      {members.length}명
     </span>
     )}
    </h3>
    <button
     onClick={() => {
     setNewCoachEmail('');
     setNewCoachUsername('');
     setAddCoachError(null);
     setActiveModal('addCoach');
     }}
     className="px-3 py-1.5 lg:px-4 lg:py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium"
    >
     + 코치 추가
    </button>
    </div>

    {/* 멤버 리스트 */}
    {membersLoading ? (
    <div className="px-4 lg:px-0">
     <div className="space-y-3">
     {[1, 2, 3].map((i) => (
      <div
      key={i}
      className="h-16 bg-surface-raised rounded-xl animate-pulse"
      />
     ))}
     </div>
    </div>
    ) : members.length === 0 ? (
    <div className="mx-4 lg:mx-0 py-12 text-center bg-surface rounded-xl border border-line">
     <p className="text-content-tertiary text-sm mb-3">
     이 조직에 등록된 멤버가 없습니다.
     </p>
     <button
     onClick={() => {
      setNewCoachEmail('');
      setNewCoachUsername('');
      setAddCoachError(null);
      setActiveModal('addCoach');
     }}
     className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium"
     >
     코치 추가
     </button>
    </div>
    ) : (
    <>
     {/* PC: 테이블 */}
     <div className="hidden lg:block bg-surface rounded-xl border border-line overflow-hidden">
     <table className="w-full">
      <thead>
      <tr className="border-b border-line bg-surface-raised">
       <th className="px-5 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wider">
       이름
       </th>
       <th className="px-5 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wider">
       이메일
       </th>
       <th className="px-5 py-3 text-left text-xs font-medium text-content-tertiary uppercase tracking-wider">
       역할
       </th>
       <th className="px-5 py-3 text-right text-xs font-medium text-content-tertiary uppercase tracking-wider">
       관리
       </th>
      </tr>
      </thead>
      <tbody className="divide-y divide-line">
      {members.map((member) => {
       const isCoach = coachByEmail.has(member.email);
       return (
       <tr
        key={member.id}
        className="hover:bg-surface-raised/50 transition-colors"
       >
        <td className="px-5 py-4">
        <div className="flex items-center gap-2">
         <span className="text-sm font-medium">
         {member.name || '-'}
         </span>
         {isCoach && (
         <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-accent-subtle text-accent">
          코치
         </span>
         )}
        </div>
        </td>
        <td className="px-5 py-4 text-sm text-content-secondary">
        {member.email}
        </td>
        <td className="px-5 py-4">
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-status-success-subtle text-status-success-text">
         {member.role}
        </span>
        </td>
        <td className="px-5 py-4 text-right">
        <button
         onClick={() => openEditModal(member)}
         className="text-sm text-accent hover:text-accent-hover font-medium"
        >
         편집
        </button>
        </td>
       </tr>
       );
      })}
      </tbody>
     </table>
     </div>

     {/* 모바일: 카드 리스트 */}
     <div className="lg:hidden px-4 space-y-2">
     {members.map((member) => {
      const isCoach = coachByEmail.has(member.email);
      return (
      <div
       key={member.id}
       className="bg-surface rounded-xl border border-line p-4 flex items-center justify-between"
      >
       <div className="min-w-0 flex-1">
       <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium truncate">
        {member.name || '-'}
        </span>
        {isCoach && (
        <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-accent-subtle text-accent flex-shrink-0">
         코치
        </span>
        )}
        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-status-success-subtle text-status-success-text flex-shrink-0">
        {member.role}
        </span>
       </div>
       <p className="text-xs text-content-tertiary truncate">
        {member.email}
       </p>
       </div>
       <button
       onClick={() => openEditModal(member)}
       className="ml-3 px-3 py-2 text-sm text-accent hover:text-accent-hover font-medium flex-shrink-0 min-h-[44px]"
       >
       편집
       </button>
      </div>
      );
     })}
     </div>
    </>
    )}
   </>
   ) : (
   <div className="py-20 text-center text-content-tertiary">
    조직을 선택해주세요.
   </div>
   )}
  </div>
  </div>

  {/* ─── 멤버 편집 모달 ─── */}
  <Modal
  open={activeModal === 'editMember'}
  onClose={closeModal}
  title="멤버 편집"
  >
  {editingMember && (
   <div>
   <div className="space-y-4">
    <div className="flex items-center gap-3 p-3 bg-surface-raised rounded-lg">
    <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center flex-shrink-0">
     <span className="text-accent font-semibold">
     {(editingMember.member.name || editingMember.member.email)
      .charAt(0)
      .toUpperCase()}
     </span>
    </div>
    <div className="min-w-0">
     <p className="text-sm font-medium truncate">
     {editingMember.member.name || '-'}
     </p>
     <p className="text-xs text-content-tertiary truncate">
     {editingMember.member.email}
     </p>
    </div>
    <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-status-success-subtle text-status-success-text flex-shrink-0">
     {editingMember.member.role}
    </span>
    </div>

    <div className="border border-line rounded-lg p-4">
    <label className="flex items-center justify-between cursor-pointer">
     <div>
     <p className="text-sm font-medium">코치로 지정</p>
     <p className="text-xs text-content-tertiary mt-0.5">
      이 멤버를 조직의 코치로 지정합니다.
     </p>
     </div>
     <div
     className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
      editCoachValue ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
     }`}
     onClick={() => setEditCoachValue(!editCoachValue)}
     >
     <div
      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
      editCoachValue ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`}
     />
     </div>
    </label>
    </div>
   </div>

   {editError && (
    <div className="mt-3 bg-status-error-subtle border border-status-error text-status-error-text px-3 py-2 rounded-lg text-sm">
    {editError}
    </div>
   )}

   <div className="flex gap-2 mt-6">
    <button
    onClick={closeModal}
    className="flex-1 px-4 py-3 text-sm rounded-xl border border-line hover:bg-surface-raised font-medium min-h-[48px]"
    disabled={editSaving}
    >
    취소
    </button>
    <button
    onClick={handleEditSave}
    className="flex-1 px-4 py-3 text-sm rounded-xl bg-accent hover:bg-accent-hover text-white font-medium min-h-[48px]"
    disabled={editSaving}
    >
    {editSaving ? '저장 중...' : '저장'}
    </button>
   </div>
   </div>
  )}
  </Modal>

  {/* ─── 코치 추가 모달 ─── */}
  <Modal
  open={activeModal === 'addCoach'}
  onClose={closeModal}
  title="코치 추가"
  >
  <form onSubmit={handleAddCoach}>
   {addCoachError && (
   <div className="mb-4 bg-status-error-subtle border border-status-error text-status-error-text px-3 py-2 rounded-lg text-sm">
    {addCoachError}
   </div>
   )}
   <div className="space-y-4">
   <div>
    <label className="block text-sm font-medium mb-1.5">이메일 *</label>
    <input
    type="email"
    value={newCoachEmail}
    onChange={(e) => setNewCoachEmail(e.target.value)}
    className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
    placeholder="coach@example.com"
    required
    />
   </div>
   <div>
    <label className="block text-sm font-medium mb-1.5">이름</label>
    <input
    type="text"
    value={newCoachUsername}
    onChange={(e) => setNewCoachUsername(e.target.value)}
    className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
    placeholder="코치 이름"
    />
    <p className="text-xs text-content-tertiary mt-1.5">
    기존 관리자면 바로 코치로 지정되고, 신규면 계정이 함께 생성됩니다.
    </p>
   </div>
   </div>
   <div className="flex gap-2 mt-6">
   <button
    type="button"
    onClick={closeModal}
    className="flex-1 px-4 py-3 text-sm rounded-xl border border-line hover:bg-surface-raised font-medium min-h-[48px]"
    disabled={addCoachLoading}
   >
    취소
   </button>
   <button
    type="submit"
    className="flex-1 px-4 py-3 text-sm rounded-xl bg-accent hover:bg-accent-hover text-white font-medium min-h-[48px]"
    disabled={addCoachLoading}
   >
    {addCoachLoading ? '추가 중...' : '추가'}
   </button>
   </div>
  </form>
  </Modal>

  {/* ─── 새 조직 추가 모달 ─── */}
  <Modal
  open={activeModal === 'addOrg'}
  onClose={closeModal}
  title="새 조직 추가"
  >
  <form onSubmit={handleAddOrganization}>
   <div className="space-y-4">
   <div>
    <label className="block text-sm font-medium mb-1.5">
    조직 이름 *
    </label>
    <input
    type="text"
    value={newOrganization.name}
    onChange={(e) =>
     setNewOrganization({ ...newOrganization, name: e.target.value })
    }
    className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
    required
    />
   </div>
   <div>
    <label className="block text-sm font-medium mb-1.5">설명</label>
    <textarea
    value={newOrganization.description}
    onChange={(e) =>
     setNewOrganization({
     ...newOrganization,
     description: e.target.value,
     })
    }
    className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
    rows={3}
    />
   </div>
   <div>
    <label className="block text-sm font-medium mb-1.5">로고 URL</label>
    <input
    type="text"
    value={newOrganization.logo_url}
    onChange={(e) =>
     setNewOrganization({
     ...newOrganization,
     logo_url: e.target.value,
     })
    }
    className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
    placeholder="https://example.com/logo.png"
    />
   </div>
   </div>
   <div className="flex gap-2 mt-6">
   <button
    type="button"
    onClick={closeModal}
    className="flex-1 px-4 py-3 text-sm rounded-xl border border-line hover:bg-surface-raised font-medium min-h-[48px]"
    disabled={addOrgLoading}
   >
    취소
   </button>
   <button
    type="submit"
    className="flex-1 px-4 py-3 text-sm rounded-xl bg-accent hover:bg-accent-hover text-white font-medium min-h-[48px]"
    disabled={addOrgLoading}
   >
    {addOrgLoading ? '추가 중...' : '추가'}
   </button>
   </div>
  </form>
  </Modal>
 </div>
 );
}
