'use client';
import { useEffect, useState } from 'react';
import SalesChart from '@/components/graph/salesChart';
import Image from 'next/image';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
import DailyDietRecord from '@/components/graph/dailyDietRecord';
import WorkoutLeaderboeard from '@/components/graph/workoutLeaderboeard';
import DietTable from '@/components/dietDashboard/dietTable';
import DateInput from '@/components/input/dateInput';
import SearchInput from '@/components/input/searchInput';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import Title from '@/components/layout/title';
import Sidebar from '@/components/fixedBars/sidebar';

interface AdminUser {
  email: string;
  display_name: string;
}

interface Challenge {
  id: string;
  title: string;
  participants: Array<any>;
}

interface CoachData {
  id: string;
  admin_user_id: string;
  organization_id: string;
  profile_image_url: string | null;
  introduction: string;
  specialization: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin_users: AdminUser;
  challenge_coaches: Array<{ challenge: Challenge }>;
}

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}
interface DailyRecord {
  record_date: string;
  challenge_participants: {
    id: string;
    users: {
      id: string;
      display_name: string;
      name: string;
    };
    challenges: {
      id: string;
      start_date: string;
      end_date: string;
    };
  };
  coach_memo?: string;
  feedback_counts?: number;
}

export default function User() {
  const [selectedDate, setSelectedDate] = useState<string>('2025-01-13');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenges[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [adminData, setAdminData] = useState({
    admin_role: '',
    display_name: '',
  });
  const [coachData, setCoachData] = useState<CoachData>({
    id: '',
    admin_user_id: '',
    organization_id: '',
    profile_image_url: '',
    introduction: '',
    specialization: [],
    is_active: false,
    created_at: '',
    updated_at: '',
    admin_users: {
      email: '',
      display_name: '',
    },
    challenge_coaches: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 챌린지 데이터 가져오기
        const challengesResponse = await fetch('/api/challenges');
        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengesData = await challengesResponse.json();
        setChallenges(challengesData);

        // 코치 데이터 가져오기
        const coachResponse = await fetch('/api/coach-info');
        if (!coachResponse.ok) {
          throw new Error('Failed to fetch coach data');
        }
        const coachData = await coachResponse.json();
        setCoachData(coachData);

        // 어드민 데이터 가져오기
        const adminResponse = await fetch('/api/admin-users');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const adminData = await adminResponse.json();
        setAdminData(adminData);

        // 데일리레코드(테이블 정보) 가져오기
        const dailyRecordsresponse = await fetch('/api/challenge-participants');
        if (!dailyRecordsresponse.ok) {
          throw new Error('Failed to fetch daily-records data');
        }
        const dailyRecordsdata = await dailyRecordsresponse.json();
        setDailyRecords(dailyRecordsdata);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChallengeSelect = (challengeId: string) => {
    // console.log('Selected Challenge ID:', challengeId);

    // 선택된 챌린지 찾기
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      // console.log('Selected Challenge:', selectedChallenge.challenges.title);
      setSelectedChallengeId(challengeId);
    }
  };

  const filteredDailyRecordsbyId = dailyRecords.filter(
    (record) =>
      record.challenge_participants.challenges.id === selectedChallengeId
  );

  const handleDateInput = (formattedDate: string) => {
    setSelectedDate(formattedDate);
    console.log(selectedDate);
  };

  return (
    <div className="bg-gray-100 dark:bg-blue-4 flex gap-[1rem] pr-[1rem] h-screen overflow-hidden">
      <Sidebar data={challenges} onSelectChallenge={handleChallengeSelect} />
      <div className="flex-1 overflow-auto">
        <div className="pt-[2rem]">
          <Title
            title={
              coachData
                ? `${coachData.organization_id} ${adminData.display_name} ${adminData.admin_role}`
                : 'Loading...'
            }
          />
          <div className="flex gap-[0.625rem] overflow-x-auto">
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'진행현황'}
              borderColor="border-green"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'오늘 운동 업로드 멤버'}
              borderColor="border-blue-5"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'오늘 식단 업로드 멤버'}
              borderColor="border-yellow"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'전체 운동 업로드 수'}
              borderColor="border-blue-5"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'전체 식단 업로드 수'}
              borderColor="border-yellow"
            />
          </div>

          <div className="dark:bg-blue-4 grid grid-cols-3 gap-[1rem] my-6">
            <TrafficSourceChart />
            <DailyDietRecord />
            <WorkoutLeaderboeard />
            <Image
              src="/image/graph-example.png"
              width={4000}
              height={4000}
              alt="graph-example"
              className="w-full col-span-3"
            />
          </div>
          <div className="dark:bg-blue-4 flex-1 p-6 bg-gray-100 pt-[7rem] bg-white-1">
            <div className="flex justify-between items-center mt-[1.5rem]">
              <DateInput onChange={handleDateInput} selectedDate="2025-01-19" />
              <SearchInput />
            </div>
            <DietTable dailyRecordsData={filteredDailyRecordsbyId} />
          </div>
        </div>
      </div>
    </div>
  );
}
