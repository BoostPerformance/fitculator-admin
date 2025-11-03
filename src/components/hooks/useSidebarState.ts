import { useState, useEffect } from 'react';

interface SidebarState {
  isSidebarOpen: boolean;
  isOpenDropdown: boolean;
  isAdminDropdownOpen: boolean;
  isOpenEndedDropdown: boolean;
  isOpenChallengeDropdown: { [id: string]: boolean };
}

const STORAGE_KEY = 'sidebar-state';

const getInitialState = (isMobile: boolean): SidebarState => {
  // 모바일에서는 localStorage 사용하지 않음
  if (isMobile || typeof window === 'undefined') {
    return {
      isSidebarOpen: false,
      isOpenDropdown: true,
      isAdminDropdownOpen: true,
      isOpenEndedDropdown: false,
      isOpenChallengeDropdown: {},
    };
  }

  // localStorage에서 가져오기
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load sidebar state from localStorage:', error);
  }

  // 기본값 (데스크톱)
  return {
    isSidebarOpen: true,
    isOpenDropdown: true,
    isAdminDropdownOpen: true,
    isOpenEndedDropdown: false,
    isOpenChallengeDropdown: {},
  };
};

export const useSidebarState = (isMobile: boolean) => {
  const [state, setState] = useState<SidebarState>(() => getInitialState(isMobile));

  // 상태가 변경될 때마다 localStorage에 저장 (데스크톱만)
  useEffect(() => {
    if (!isMobile && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save sidebar state to localStorage:', error);
      }
    }
  }, [state, isMobile]);

  const setIsSidebarOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    setState((prev) => ({
      ...prev,
      isSidebarOpen: typeof value === 'function' ? value(prev.isSidebarOpen) : value,
    }));
  };

  const setIsOpenDropdown = (value: boolean | ((prev: boolean) => boolean)) => {
    setState((prev) => ({
      ...prev,
      isOpenDropdown: typeof value === 'function' ? value(prev.isOpenDropdown) : value,
    }));
  };

  const setIsAdminDropdownOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    setState((prev) => ({
      ...prev,
      isAdminDropdownOpen: typeof value === 'function' ? value(prev.isAdminDropdownOpen) : value,
    }));
  };

  const setIsOpenEndedDropdown = (value: boolean | ((prev: boolean) => boolean)) => {
    setState((prev) => ({
      ...prev,
      isOpenEndedDropdown: typeof value === 'function' ? value(prev.isOpenEndedDropdown) : value,
    }));
  };

  const setIsOpenChallengeDropdown = (
    value: { [id: string]: boolean } | ((prev: { [id: string]: boolean }) => { [id: string]: boolean })
  ) => {
    setState((prev) => ({
      ...prev,
      isOpenChallengeDropdown:
        typeof value === 'function' ? value(prev.isOpenChallengeDropdown) : value,
    }));
  };

  return {
    isSidebarOpen: state.isSidebarOpen,
    isOpenDropdown: state.isOpenDropdown,
    isAdminDropdownOpen: state.isAdminDropdownOpen,
    isOpenEndedDropdown: state.isOpenEndedDropdown,
    isOpenChallengeDropdown: state.isOpenChallengeDropdown,
    setIsSidebarOpen,
    setIsOpenDropdown,
    setIsAdminDropdownOpen,
    setIsOpenEndedDropdown,
    setIsOpenChallengeDropdown,
  };
};
