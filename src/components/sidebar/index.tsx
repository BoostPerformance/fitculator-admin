'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

import NoticeModal from '../input/noticeModal';
import EditUsernameModal from '../modals/editUsernameModal';
import { useAdminData } from '../hooks/useAdminData';
import { useSidebarState } from '../hooks/useSidebarState';
import { useRecentChallenges } from '../hooks/useRecentChallenges';
import { SidebarSkeleton } from '../ui/Skeleton';

import { SidebarHeader } from './sidebar-header';
import { SidebarNavGroup } from './sidebar-nav-group';
import { SidebarAdminMenu } from './sidebar-admin-menu';
import { SidebarFooter } from './sidebar-footer';
import {
 RecentChallengesSection,
 ActiveChallengesSection,
 EndedChallengesSection,
} from './sidebar-challenge-list';
import { MobileHeaderBar, MobileSidebarOverlay } from './sidebar-mobile';
import type { SidebarProps, ChallengeData } from './types';

export type { ChallengeData, SidebarProps };

export default function Sidebar({
 data,
 onSelectChallenge,
 selectedChallengeId,
 coach,
 username,
 isSidebarOpen: controlledSidebarOpen,
 onSidebarOpenChange,
}: SidebarProps) {
 const isControlled = controlledSidebarOpen !== undefined;

 const [selectedTitle, setSelectedTitle] = useState('');
 const [userDropdown, setUserDropdown] = useState(false);
 const [isMobile, setIsMobile] = useState(false);
 const [sidebarWidth, setSidebarWidth] = useState(256);
 const [isResizing, setIsResizing] = useState(false);
 const [isScrolled, setIsScrolled] = useState(false);
 const [mounted, setMounted] = useState(false);

 useEffect(() => { setMounted(true); }, []);

 const {
 isSidebarOpen: internalSidebarOpen,
 isOpenDropdown,
 isAdminDropdownOpen,
 isOpenEndedDropdown,
 isOpenChallengeDropdown,
 setIsSidebarOpen: setInternalSidebarOpen,
 setIsOpenDropdown,
 setIsAdminDropdownOpen,
 setIsOpenEndedDropdown,
 setIsOpenChallengeDropdown,
 } = useSidebarState(isMobile);

 // Use controlled state for desktop when props are provided, otherwise internal state
 const isSidebarOpen = (!isMobile && isControlled) ? controlledSidebarOpen : internalSidebarOpen;
 const setIsSidebarOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
 if (!isMobile && isControlled && onSidebarOpenChange) {
  const newValue = typeof value === 'function' ? value(controlledSidebarOpen) : value;
  onSidebarOpenChange(newValue);
 } else {
  setInternalSidebarOpen(value);
 }
 }, [isMobile, isControlled, controlledSidebarOpen, onSidebarOpenChange, setInternalSidebarOpen]);

 const [modalOpen, setModalOpen] = useState(false);
 const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
 const [editUsernameModal, setEditUsernameModal] = useState(false);
 const [notices, setNotices] = useState([
 { id: '1', title: '첫 번째 공지사항', content: '' },
 { id: '2', title: '두 번째 공지사항', content: '' },
 { id: '3', title: '세 번째 공지사항', content: '' },
 ]);

 const router = useRouter();
 const { data: session } = useSession();
 const { adminData, displayUsername: hookDisplayUsername, isLoading: adminDataLoading, fetchAdminData, hasData } = useAdminData();
 const { recentChallenges, addRecentChallenge, removeRecentChallenge } = useRecentChallenges();

 const { data: coachIdentity } = useQuery({
 queryKey: ['coach-identity'],
 queryFn: async () => {
 const res = await fetch('/api/coach-identity');
 if (!res.ok) return null;
 const json = await res.json();
 return json.data as { userId: string; coachId: string; name: string; profileImageUrl: string | null } | null;
 },
 staleTime: Infinity,
 });

 // ─── Computed ─────────────────────────────────────────────
 const activeChallenges = useMemo(() => {
 return data.filter((c) => {
 const endDate = new Date(c.challenges.end_date);
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 return endDate >= today;
 });
 }, [data]);

 const endedChallenges = useMemo(() => {
 return data.filter((c) => {
 const endDate = new Date(c.challenges.end_date);
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 return endDate < today;
 });
 }, [data]);

 const recentChallengesData = useMemo(() => {
 return recentChallenges
 .map((id) => data.find((c) => c.challenges.id === id))
 .filter((c): c is ChallengeData => c !== undefined)
 .slice(0, 3);
 }, [recentChallenges, data]);

 const hasOperationalAccess = useMemo(() => {
 const operationalEmails = ['ryoohyun@fitculator.io', 'cuteprobe@gmail.com'];
 const userEmail = session?.user?.email;
 if (userEmail && operationalEmails.includes(userEmail)) return true;
 return adminData?.admin_role && ['internal_operator', 'system_admin', 'developer'].includes(adminData.admin_role);
 }, [session?.user?.email, adminData?.admin_role]);

 // ─── Handlers ─────────────────────────────────────────────
 const handleUsernameUpdate = async (newUsername: string) => {
 const response = await fetch('/api/admin-users', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ username: newUsername }),
 });
 if (!response.ok) throw new Error('Failed to update username');
 await fetchAdminData();
 };

 const closeSidebarOnMobile = useCallback(() => {
 if (isMobile) setIsSidebarOpen(false);
 }, [isMobile, setIsSidebarOpen]);

 const handleChallengeClick = useCallback((challenge: ChallengeData) => {
 setSelectedTitle(challenge.challenges.title);
 onSelectChallenge(challenge.challenges.id);
 addRecentChallenge(challenge.challenges.id);
 router.push(`/${challenge.challenges.id}`);
 closeSidebarOnMobile();
 }, [onSelectChallenge, router, closeSidebarOnMobile, addRecentChallenge]);

 const handleSidebarOpen = useCallback(() => {
 setIsSidebarOpen(!isSidebarOpen);
 setUserDropdown(false);
 setIsOpenDropdown(true);
 if (selectedChallengeId) onSelectChallenge(selectedChallengeId);
 }, [isSidebarOpen, selectedChallengeId, onSelectChallenge, setIsSidebarOpen, setIsOpenDropdown]);

 const handleUserDropdown = useCallback(() => {
 setUserDropdown(!userDropdown);
 if (!userDropdown) setIsSidebarOpen(false);
 }, [userDropdown, setIsSidebarOpen]);

 const toggleChallengeDropdown = useCallback((challengeId: string) => {
 setIsOpenChallengeDropdown((prev) => ({ ...prev, [challengeId]: !prev[challengeId] }));
 }, [setIsOpenChallengeDropdown]);

 const handleDropdown = useCallback(() => {
 setIsOpenDropdown(!isOpenDropdown);
 }, [isOpenDropdown, setIsOpenDropdown]);

 const handleAdminDropdown = useCallback(() => {
 setIsAdminDropdownOpen(!isAdminDropdownOpen);
 }, [isAdminDropdownOpen, setIsAdminDropdownOpen]);

 const handleEndedDropdown = useCallback(() => {
 setIsOpenEndedDropdown(!isOpenEndedDropdown);
 }, [isOpenEndedDropdown, setIsOpenEndedDropdown]);

 const handleSaveNotice = (updatedNotice: { id?: string; title: string; content: string }) => {
 if (updatedNotice.id) {
 setNotices((prev) => prev.map((n) => (n.id === updatedNotice.id ? { ...n, ...updatedNotice } : n)));
 } else {
 const newId = String(notices.length + 1);
 setNotices((prev) => [...prev, { ...updatedNotice, id: newId }]);
 }
 setModalOpen(false);
 setSelectedNoticeId(null);
 };

 const selectedNoticeData = notices.find((n) => n.id === selectedNoticeId) || null;

 // ─── Effects ──────────────────────────────────────────────
 // Selected challenge title sync
 useEffect(() => {
 const selected = data.find((item) => item.challenges.id === selectedChallengeId);
 if (selected) {
 setSelectedTitle(selected.challenges.title);
 setIsOpenDropdown(true);
 }
 }, [selectedChallengeId, data]);

 // Keyboard shortcuts
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
 e.preventDefault();
 setIsSidebarOpen((prev) => !prev);
 return;
 }
 if (e.key === 'Escape') {
 if (isMobile && isSidebarOpen) { setIsSidebarOpen(false); return; }
 if (userDropdown) { setUserDropdown(false); return; }
 if (modalOpen) { setModalOpen(false); return; }
 if (editUsernameModal) { setEditUsernameModal(false); return; }
 }
 };
 document.addEventListener('keydown', handleKeyDown);
 return () => document.removeEventListener('keydown', handleKeyDown);
 }, [isMobile, isSidebarOpen, userDropdown, modalOpen, editUsernameModal, setIsSidebarOpen]);

 // Sidebar width from localStorage
 useEffect(() => {
 if (typeof window !== 'undefined' && !isMobile) {
 const savedWidth = localStorage.getItem('sidebar-width');
 if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
 }
 }, [isMobile]);

 // Responsive breakpoint
 useEffect(() => {
 let wasMobile = window.innerWidth < 1025;
 const handleResize = () => {
 const mobile = window.innerWidth < 1025;
 // Only close sidebar when transitioning from desktop to mobile
 if (mobile && !wasMobile) {
 setInternalSidebarOpen(false);
 setIsOpenDropdown(true);
 }
 wasMobile = mobile;
 setIsMobile(mobile);
 };
 handleResize();
 window.addEventListener('resize', handleResize);
 return () => window.removeEventListener('resize', handleResize);
 }, [setInternalSidebarOpen, setIsOpenDropdown]);

 // Resize handle
 const handleMouseDown = useCallback((e: React.MouseEvent) => {
 if (!isMobile) { setIsResizing(true); e.preventDefault(); }
 }, [isMobile]);

 useEffect(() => {
 const handleMouseMove = (e: MouseEvent) => {
 if (!isResizing || isMobile) return;
 const newWidth = e.clientX;
 if (newWidth >= 200 && newWidth <= 400) {
 setSidebarWidth(newWidth);
 localStorage.setItem('sidebar-width', newWidth.toString());
 }
 };
 const handleMouseUp = () => setIsResizing(false);
 if (isResizing) {
 document.addEventListener('mousemove', handleMouseMove);
 document.addEventListener('mouseup', handleMouseUp);
 }
 return () => {
 document.removeEventListener('mousemove', handleMouseMove);
 document.removeEventListener('mouseup', handleMouseUp);
 };
 }, [isResizing, isMobile]);

 // Scroll shadow
 useEffect(() => {
 const handleScroll = () => {
 const container = document.getElementById('sidebar-menu-container');
 if (container) setIsScrolled(container.scrollTop > 0);
 };
 const container = document.getElementById('sidebar-menu-container');
 if (container) container.addEventListener('scroll', handleScroll);
 return () => { if (container) container.removeEventListener('scroll', handleScroll); };
 }, [isSidebarOpen]);

 // ─── Render ───────────────────────────────────────────────
 const displayName = username || hookDisplayUsername;

 return (
 <>
 {/* Skip navigation */}
 <a
 href="#main-content"
 className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
 >
 메인 콘텐츠로 건너뛰기
 </a>

 {/* Mobile overlay (Portal) */}
 {mounted && isMobile && isSidebarOpen && createPortal(
 <MobileSidebarOverlay
 data={data}
 selectedChallengeId={selectedChallengeId}
 isOpenDropdown={isOpenDropdown}
 isAdminDropdownOpen={isAdminDropdownOpen}
 isOpenEndedDropdown={isOpenEndedDropdown}
 isOpenChallengeDropdown={isOpenChallengeDropdown}
 recentChallengesData={recentChallengesData}
 activeChallenges={activeChallenges}
 endedChallenges={endedChallenges}
 hasOperationalAccess={!!hasOperationalAccess}
 onClose={handleSidebarOpen}
 onDropdownToggle={handleDropdown}
 onAdminDropdownToggle={handleAdminDropdown}
 onEndedDropdownToggle={handleEndedDropdown}
 onChallengeDropdownToggle={toggleChallengeDropdown}
 onChallengeClick={handleChallengeClick}
 onRemoveRecent={removeRecentChallenge}
 closeSidebarOnMobile={closeSidebarOnMobile}
 onSelectChallenge={onSelectChallenge}
 onAddRecent={addRecentChallenge}
 />,
 document.body
 )}

 {/* Mobile header bar (closed) + Desktop sidebar */}
 {(!isMobile || !isSidebarOpen) && (
 <aside
 className={cn(
 'min-h-fit lg:min-h-screen lg:px-4 bg-surface relative transition-all duration-300 ease-in-out safe-area-inset-bottom',
 isMobile && !isSidebarOpen && 'w-full sticky top-0 z-[100]',
 !isMobile && !isSidebarOpen && 'lg:w-16 min-w-16',
 !isMobile && isSidebarOpen && 'sm:min-w-48 md:min-w-56',
 !isMobile && 'drop-shadow-sm',
 )}
 style={!isMobile && isSidebarOpen ? { width: `${sidebarWidth}px` } : undefined}
 role="navigation"
 aria-label="주 내비게이션"
 >
 {/* Mobile closed: header bar */}
 {isMobile && !isSidebarOpen && (
 <MobileHeaderBar
 username={displayName}
 userDropdown={userDropdown}
 onToggleSidebar={handleSidebarOpen}
 onToggleUserDropdown={handleUserDropdown}
 onEditUsername={() => { setEditUsernameModal(true); setUserDropdown(false); }}
 email={session?.user?.email || ''}
 isLoading={adminDataLoading}
 hasData={hasData}
 profileImageUrl={coachIdentity?.profileImageUrl}
 />
 )}

 {/* Desktop header (uncontrolled: logo + toggle) */}
 {!isMobile && !isControlled && (
 <SidebarHeader
 isSidebarOpen={isSidebarOpen}
 isScrolled={isScrolled}
 onToggle={handleSidebarOpen}
 />
 )}

 {/* Desktop nav */}
 {!isMobile && isSidebarOpen && (
 <div
 id="sidebar-menu-container"
 className="w-full flex flex-col z-50 flex-1"
 role="region"
 aria-label="메뉴 목록"
 onClick={(e) => e.stopPropagation()}
 >
 <nav className="w-full items-start py-2 px-3 lg:py-4 lg:px-2 flex-1" aria-label="챌린지 및 관리 메뉴">
 {(!data || data.length === 0) && <SidebarSkeleton />}
 {data && data.length > 0 && (
 <ul>
 <SidebarNavGroup
 title="프로그램"
 isOpen={isOpenDropdown}
 onToggle={handleDropdown}
 ariaLabel="프로그램 메뉴"
 ariaControls="program-menu-list"
 >
 <RecentChallengesSection
 challenges={recentChallengesData}
 selectedChallengeId={selectedChallengeId}
 onSelect={handleChallengeClick}
 onRemove={removeRecentChallenge}
 />
 <ActiveChallengesSection
 challenges={activeChallenges}
 selectedChallengeId={selectedChallengeId}
 isOpenChallengeDropdown={isOpenChallengeDropdown}
 onToggleDropdown={toggleChallengeDropdown}
 onNavigate={closeSidebarOnMobile}
 onSelectChallenge={onSelectChallenge}
 onAddRecent={addRecentChallenge}
 />
 <EndedChallengesSection
 challenges={endedChallenges}
 selectedChallengeId={selectedChallengeId}
 isOpen={isOpenEndedDropdown}
 onToggle={handleEndedDropdown}
 isOpenChallengeDropdown={isOpenChallengeDropdown}
 onToggleDropdown={toggleChallengeDropdown}
 onNavigate={closeSidebarOnMobile}
 onSelectChallenge={onSelectChallenge}
 onAddRecent={addRecentChallenge}
 />
 </SidebarNavGroup>

 {hasOperationalAccess && (
 <SidebarAdminMenu
 isOpen={isAdminDropdownOpen}
 onToggle={handleAdminDropdown}
 onNavigate={closeSidebarOnMobile}
 />
 )}
 </ul>
 )}
 </nav>

 <SidebarFooter onNavigate={closeSidebarOnMobile} />
 </div>
 )}

 {/* Modals */}
 {modalOpen && (
 <NoticeModal
 onClose={() => { setModalOpen(false); setSelectedNoticeId(null); }}
 challengeId={selectedChallengeId ?? ''}
 noticeId={selectedNoticeId}
 defaultTitle={selectedNoticeData?.title || ''}
 defaultContent={selectedNoticeData?.content || ''}
 onSave={handleSaveNotice}
 />
 )}

 <EditUsernameModal
 isOpen={editUsernameModal}
 currentUsername={adminData?.username || ''}
 onClose={() => setEditUsernameModal(false)}
 onSave={handleUsernameUpdate}
 />

 {/* Resize handle */}
 {!isMobile && isSidebarOpen && (
 <div
 className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent transition-colors group"
 onMouseDown={handleMouseDown}
 role="separator"
 aria-label="사이드바 너비 조절"
 aria-orientation="vertical"
 >
 <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-1.5 h-12 bg-neutral-300 dark:bg-neutral-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 )}
 </aside>
 )}
 </>
 );
}
