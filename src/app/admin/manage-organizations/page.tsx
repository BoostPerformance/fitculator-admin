'use client';
import { useState, useEffect } from 'react';
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

export default function ManageOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [organizationMembers, setOrganizationMembers] = useState<
    OrganizationMember[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 새 조직 추가를 위한 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    description: '',
    logo_url: '',
  });

  // 조직 목록 가져오기
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error('조직 데이터를 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setOrganizations(data);

        // 첫 번째 조직을 기본 선택
        if (data.length > 0 && !selectedOrganization) {
          setSelectedOrganization(data[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
        );
        console.error('조직 데이터 가져오기 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [selectedOrganization]);

  // 선택된 조직의 멤버 가져오기
  useEffect(() => {
    const fetchOrganizationMembers = async () => {
      if (!selectedOrganization) return;

      try {
        setLoading(true);
        // 실제 API 엔드포인트로 교체 필요
        const response = await fetch(
          `/api/organizations/${selectedOrganization.id}/members`
        );
        if (!response.ok) {
          throw new Error('조직 멤버 데이터를 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setOrganizationMembers(data);
      } catch (err) {
        console.error('조직 멤버 데이터 가져오기 오류:', err);
        // 실제 API가 없으므로 임시 데이터 사용
        setOrganizationMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationMembers();
  }, [selectedOrganization]);

  // 새 조직 추가 핸들러
  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrganization.name.trim()) {
      setError('조직 이름은 필수입니다.');
      return;
    }

    try {
      setLoading(true);
      // 실제 API 엔드포인트로 교체 필요
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrganization),
      });

      if (!response.ok) {
        throw new Error('조직 추가에 실패했습니다.');
      }

      const addedOrganization = await response.json();
      setOrganizations([...organizations, addedOrganization]);
      setSelectedOrganization(addedOrganization);
      setShowAddForm(false);
      setNewOrganization({ name: '', description: '', logo_url: '' });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
      console.error('조직 추가 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 조직 선택 핸들러
  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrganization(org);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Title title="조직 관리" />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* 조직 목록 */}
        <div className="w-full md:w-1/3 bg-white dark:bg-blue-3 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">조직 목록</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
            >
              {showAddForm ? '취소' : '+ 새 조직'}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddOrganization}
              className="mb-4 p-3 bg-gray-50 dark:bg-blue-4 rounded-md"
            >
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  조직 이름 *
                </label>
                <input
                  type="text"
                  value={newOrganization.name}
                  onChange={(e) =>
                    setNewOrganization({
                      ...newOrganization,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md dark:bg-blue-3 dark:border-blue-2"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea
                  value={newOrganization.description}
                  onChange={(e) =>
                    setNewOrganization({
                      ...newOrganization,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md dark:bg-blue-3 dark:border-blue-2"
                  rows={3}
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  로고 URL
                </label>
                <input
                  type="text"
                  value={newOrganization.logo_url}
                  onChange={(e) =>
                    setNewOrganization({
                      ...newOrganization,
                      logo_url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md dark:bg-blue-3 dark:border-blue-2"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                  disabled={loading}
                >
                  {loading ? '처리 중...' : '추가'}
                </button>
              </div>
            </form>
          )}

          {loading && organizations.length === 0 ? (
            <div className="text-center py-4">로딩 중...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              등록된 조직이 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {organizations.map((org) => (
                <li
                  key={org.id}
                  onClick={() => handleSelectOrganization(org)}
                  className={`p-3 rounded-md cursor-pointer ${
                    selectedOrganization?.id === org.id
                      ? 'bg-blue-100 dark:bg-blue-2'
                      : 'hover:bg-gray-100 dark:hover:bg-blue-4'
                  }`}
                >
                  <div className="flex items-center">
                    {org.logo_url ? (
                      <div className="w-10 h-10 mr-3 rounded-full overflow-hidden">
                        <Image
                          src={org.logo_url}
                          alt={org.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 mr-3 rounded-full bg-gray-200 dark:bg-blue-4 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-300 text-lg font-semibold">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{org.name}</h3>
                      {org.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 조직 상세 정보 및 멤버 */}
        <div className="w-full md:w-2/3 bg-white dark:bg-blue-3 rounded-lg shadow p-4">
          {selectedOrganization ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  {selectedOrganization.name}
                </h2>
                {selectedOrganization.description && (
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedOrganization.description}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">조직 멤버</h3>
                {loading ? (
                  <div className="text-center py-4">멤버 정보 로딩 중...</div>
                ) : organizationMembers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    이 조직에 등록된 멤버가 없습니다.
                    <div className="mt-2">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                        멤버 추가
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-blue-2">
                      <thead className="bg-gray-50 dark:bg-blue-4">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            이름
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            이메일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            역할
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-blue-3 divide-y divide-gray-200 dark:divide-blue-2">
                        {organizationMembers.map((member) => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {member.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-300">
                                {member.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-blue-2 text-green-800 dark:text-green-400">
                                {member.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              <button className="text-blue-500 hover:text-blue-700 mr-2">
                                편집
                              </button>
                              <button className="text-red-500 hover:text-red-700">
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              조직을 선택하거나 새 조직을 추가해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
