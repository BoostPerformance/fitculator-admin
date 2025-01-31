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
  id: string;
  record_date: string;
  feedbacks: {
    coach_feedback: string;
    created_at: string;
    id: string;
  }[];
}

interface ChallengeParticipant {
  id: string;
  users: {
    id: string;
    name: string;
    display_name: string;
  };
  challenges: {
    id: string;
    title: string;
    end_date: string;
    start_date: string;
    challenge_type: string;
  };
  daily_records: DailyRecord[];
}
export default function User() {
  const [selectedDate, setSelectedDate] = useState<string>('2025-01-13');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenges[]>([]);
  const [dailyRecords, setDailyRecords] = useState<ChallengeParticipant[]>([]);
  const [isMobile, setIsMobile] = useState(false);
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
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // 초기 설정
    handleResize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);

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
    const mobileSize = () => window.removeEventListener('resize', handleResize);
    return mobileSize;
  }, []);

  const handleChallengeSelect = (challengeId: string) => {
    // 선택된 챌린지 찾기
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
    }
  };

  const filteredDailyRecordsbyId = dailyRecords.filter(
    (record) => record.challenges.id === selectedChallengeId
  );
  console.log('filteredDailyRecordsbyId', filteredDailyRecordsbyId);

  return (
    <div className="bg-white-1 dark:bg-blue-4 flex gap-[1rem] pr-[1rem] h-screen overflow-hidden sm:flex-col">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        coach={adminData.display_name}
      />
      <div className="flex-1 overflow-auto">
        <div className="pt-[2rem]">
          <Title
            title={
              coachData &&
              `${coachData.organization_id} ${adminData.display_name} ${adminData.admin_role}`
            }
          />
          <div className="flex gap-[0.625rem] overflow-x-auto sm:grid sm:grid-cols-2 sm:grid-rows-3">
            <TotalFeedbackCounts
              counts="10"
              total="30"
              title="진행현황"
              borderColor="border-green"
              textColor="text-green"
              grids="col-span-2"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'오늘 운동 업로드 멤버'}
              borderColor="border-blue-5"
              textColor="text-blue-5"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'오늘 식단 업로드 멤버'}
              borderColor="border-yellow"
              textColor="text-yellow"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'전체 운동 업로드 수'}
              borderColor="border-blue-5"
              textColor="text-blue-5"
            />
            <TotalFeedbackCounts
              counts={'10'}
              total={'30'}
              title={'전체 식단 업로드 수'}
              borderColor="border-yellow"
              textColor="text-yellow"
            />
          </div>

          <div className="dark:bg-blue-4 grid grid-cols-7 gap-[1rem] my-6 sm:flex sm:flex-col">
            <TrafficSourceChart />
            <DailyDietRecord activities={filteredDailyRecordsbyId} />
            <WorkoutLeaderboeard />
            <Image
              src={
                isMobile
                  ? '/image/graph-example2.png'
                  : '/image/cardio-graph.png'
              }
              width={4000}
              height={4000}
              alt={isMobile ? 'graph-example1.png' : 'cardio-graph.png'}
              className="w-full lg:col-span-3"
            />
            {!isMobile && (
              <Image
                src="/image/weight-graph.png"
                width={4000}
                height={4000}
                alt=""
                className="w-full lg:col-span-3"
              />
            )}
          </div>
          <div className="dark:bg-blue-4 bg-gray-100 lg:pt-[3rem] sm:pt-[2rem] bg-white-1">
            <DietTable dailyRecordsData={filteredDailyRecordsbyId} />
          </div>
        </div>
      </div>
    </div>
  );
}
