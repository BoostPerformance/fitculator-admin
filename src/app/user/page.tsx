'use client';
import { useEffect, useState } from 'react';
//import Image from 'next/image';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
import DailyDietRecord from '@/components/graph/dailyDietRecord';
import WorkoutLeaderboeard from '@/components/graph/workoutLeaderboeard';
import DietTable from '@/components/dietDashboard/dietTable';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import Title from '@/components/layout/title';
// import Sidebar from '@/components/fixedBars/sidebar';
import { useParams } from 'next/navigation';
import {
  calculateTodayDietUploads,
  calculateTotalDietUploads,
} from '@/components/statistics/challengeParticipantsDietStatics';
//import DailyDietRecordMobile from '@/components/graph/dailyDietRecordMobile';
import UserLayout from '@/app/user/layout';

interface AdminUser {
  email: string;
  username: string;
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
  organization_name: string;
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

// interface ChallengeParticipant {
//   id: string;
//   users: {
//     id: string;
//     name: string;
//     username: string;
//   };
//   challenges: {
//     id: string;
//     title: string;
//     end_date: string;
//     start_date: string;
//     challenge_type: string;
//   };
//   daily_records: DailyRecord[];
// }
type ParamsType = {
  challengeId: string;
};

// interface Workouts {
//   created_at: string;
// }

const calculateChallengeProgress = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // 전체 챌린지 기간 계산
  const totalDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 오늘까지의 진행 일수 계산
  let progressDays;
  if (today < start) {
    progressDays = 0;
  } else if (today > end) {
    progressDays = totalDays;
  } else {
    progressDays = Math.ceil(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    progressDays: progressDays.toString(),
    totalDays: totalDays.toString(),
  };
};

export default function User() {
  const params = useParams() as ParamsType;
  const [workoutCount, setWorkoutCount] = useState([]);
  const [workOutCountToday, setWorkOutCountToday] = useState<number>(0);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenges[]>([]);
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [adminData, setAdminData] = useState({
    admin_role: '',
    username: '',
  });
  const [coachData, setCoachData] = useState<CoachData>({
    id: '',
    admin_user_id: '',
    organization_id: '',
    organization_name: '',
    profile_image_url: '',
    introduction: '',
    specialization: [],
    is_active: false,
    created_at: '',
    updated_at: '',
    admin_users: {
      email: '',
      username: '',
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
        const workoutData = await fetch('/api/workouts');

        if (!workoutData.ok) {
          throw new Error('Failed to fetch workoutData');
        }
        const workoutDataResponse = await workoutData.json();

        //console.log('workoutDataResponse', workoutDataResponse);
        const today = new Date().toISOString().split('T')[0];
        //const yesterday = '2025-02-10';

        const workOutCount = workoutDataResponse.filter((item: any) => {
          const createdAt = item.created_at.split('T')[0];

          return createdAt === today;
        }).length;

        setWorkoutCount(workOutCount);

        // 먼저 오늘 날짜의 기록만 필터링
        const todaysWorkouts = workoutDataResponse.filter((item: any) => {
          const createdAt = item.created_at.split('T')[0];
          return createdAt === today;
        });

        const arrWorkout = todaysWorkouts.map((item: any) => {
          return item.user_id;
        });
        const newSet = new Set(arrWorkout);
        const totalWorkoutUploadMember = newSet.size;
        // console.log('newSet', newSet.size);

        // // 필터링된 기록에서 고유한 user_id만 추출
        // const uniqueUsers = new Set(
        //   todaysWorkouts.map((item: any) => {
        //     //   console.log('todaysWorkouts item', item);
        //     return item.user_id;
        //   })
        // );

        // // 고유한 사용자 수
        // const workOutCounting = uniqueUsers.size;

        setWorkOutCountToday(totalWorkoutUploadMember);
        // console.log('Unique users who worked out today:', workOutCount);

        // 챌린지 데이터 가져오기

        const challengesResponse = await fetch('/api/challenges');
        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengesData = await challengesResponse.json();
        // console.log('challengesData', challengesData);

        const sortedChallenges = challengesData.sort(
          (a: Challenges, b: Challenges) => {
            return (
              new Date(b.challenges.start_date).getTime() -
              new Date(a.challenges.start_date).getTime()
            );
          }
        );

        setChallenges(sortedChallenges);
        // 첫 번째 챌린지를 기본값으로 설정
        if (sortedChallenges.length > 0) {
          setSelectedChallengeId(sortedChallenges[0].challenges.id);
        }

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

        // console.log('dailyRecordsdata user-page', dailyRecordsdata);

        setDailyRecords(dailyRecordsdata);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const mobileSize = () => window.removeEventListener('resize', handleResize);
    return mobileSize;
  }, []);

  useEffect(() => {
    const urlChallengeId = params.challengeId;

    if (
      urlChallengeId &&
      challenges.some((c) => c.challenges.id === urlChallengeId)
    ) {
      setSelectedChallengeId(urlChallengeId);
    }
  }, [challenges]);
  //console.log('coachData', coachData);
  // const handleChallengeSelect = (challengeId: string) => {
  //   // 선택된 챌린지 찾기
  //   const selectedChallenge = challenges.find(
  //     (challenge) => challenge.challenges.id === challengeId
  //   );

  //   if (selectedChallenge) {
  //     setSelectedChallengeId(challengeId);
  //   }
  // };

  const filteredDailyRecordsbyId = dailyRecords.filter(
    (record) => record.challenges.id === selectedChallengeId
  );
  //console.log('dailyRecords user page', dailyRecords);

  const getSelectedChallengeDates = () => {
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === selectedChallengeId
    );
    return selectedChallenge
      ? {
          startDate: selectedChallenge.challenges.start_date,
          endDate: selectedChallenge.challenges.end_date,
        }
      : null;
  };

  const challengeDates = getSelectedChallengeDates();
  const progress = challengeDates
    ? calculateChallengeProgress(
        challengeDates.startDate,
        challengeDates.endDate
      )
    : { progressDays: '0', totalDays: '0' };

  return (
      <div className="overflow-hidden">
        <div className="mb-[1.25rem]">
          <Title title={ coachData && `${coachData.organization_name} ${adminData.username} ${adminData.admin_role}` }/>
        </div>
        <div className="flex justify-between gap-[1rem] overflow-x-auto sm:grid">
          <TotalFeedbackCounts
            counts={progress.progressDays}
            total={`${progress.totalDays}일`}
            title="진행현황"
            borderColor="border-green"
            textColor="text-green"
            grids="col-span-2"
          />
          <TotalFeedbackCounts
            counts={`${workOutCountToday}`}
            total={'24명'}
            title={
              <span>
                오늘 운동 <br className="md:inline sm:hidden lg:hidden" />
                업로드 멤버
              </span>
            }
            borderColor="border-blue-5"
            textColor="text-blue-5"
          />
          <TotalFeedbackCounts
            counts={
              calculateTodayDietUploads(
                dailyRecords,
                challenges,
                selectedChallengeId
              ).counts
            }
            total={
              calculateTodayDietUploads(
                dailyRecords,
                challenges,
                selectedChallengeId
              ).total
            }
            title={
              <span>
                오늘 식단 <br className="md:inline sm:hidden lg:hidden" />
                업로드 멤버
              </span>
            }
            borderColor="border-yellow"
            textColor="text-yellow"
            grids="col-span-1"
          />
          <TotalFeedbackCounts
            counts={`${workoutCount}개`}
            total={''}
            title={
              <span>
                전체 운동 <br className="md:inline sm:hidden lg:hidden" />
                업로드 수
              </span>
            }
            borderColor="border-blue-5"
            textColor="text-blue-5"
          />
          <TotalFeedbackCounts
            counts={
              calculateTotalDietUploads(
                dailyRecords,
                challenges,
                selectedChallengeId
              ).counts
            }
            total={
              calculateTotalDietUploads(
                dailyRecords,
                challenges,
                selectedChallengeId
              ).total
            }
            title={
              <span>
                전체 식단 <br className="md:inline sm:hidden lg:hidden" />
                업로드 수
              </span>
            }
            borderColor="border-yellow"
            textColor="text-yellow"
          />
        </div>

        <div className="dark:bg-blue-4 grid grid-cols-6 gap-[1rem] my-[1.25rem] sm:flex sm:flex-col">
          <TrafficSourceChart />
          <DailyDietRecord activities={filteredDailyRecordsbyId} />
          {/* <DailyDietRecordMobile activities={filteredDailyRecordsbyId} /> */}
          <WorkoutLeaderboeard />
        </div>
        {/* <div>
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
        </div> */}
        <div className="dark:bg-blue-4 bg-gray-100 bg-white-1">
          <DietTable dailyRecordsData={filteredDailyRecordsbyId} />
        </div>
      </div>
  );
}