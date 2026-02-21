'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { SidebarNavGroup } from './sidebar-nav-group';
import { SidebarNavItem } from './sidebar-nav-item';

interface SidebarAdminMenuProps {
 isOpen: boolean;
 onToggle: () => void;
 onNavigate?: () => void;
 mobile?: boolean;
}

const adminRoutes = [
 { label: '챌린지 생성', path: '/admin/create-challenge' },
 { label: '챌린지 관리', path: '/admin/manage-challenges' },
 { label: '조직 관리', path: '/admin/manage-organizations' },
 { label: '대회 관리', path: '/admin/manage-competitions' },
];

export function SidebarAdminMenu({ isOpen, onToggle, onNavigate, mobile }: SidebarAdminMenuProps) {
 const router = useRouter();
 const pathname = usePathname();

 const isActiveRoute = useCallback((route: string) => {
 return pathname === route || pathname?.startsWith(route);
 }, [pathname]);

 return (
 <div className="mt-4">
 <SidebarNavGroup
 title="운영 관리"
 isOpen={isOpen}
 onToggle={onToggle}
 ariaLabel="운영 관리 메뉴"
 ariaControls={`admin-menu-list${mobile ? '-mobile' : ''}`}
 mobile={mobile}
 >
 {adminRoutes.map((route) => (
 <SidebarNavItem
 key={route.path}
 label={route.label}
 isActive={isActiveRoute(route.path)}
 onClick={() => {
 router.push(route.path);
 onNavigate?.();
 }}
 />
 ))}
 </SidebarNavGroup>
 </div>
 );
}
