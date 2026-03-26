'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useChallenge } from '@/components/hooks/useChallenges';
import Title from '@/components/layout/title';
import {
 Trophy, Timer, MapPin, ChevronDown, ChevronUp, X,
 Dumbbell, Heart, Flame, Zap, Users, List, FolderOpen, Merge, Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
type CompetitionFilter = 'all' | 'hyrox' | 'marathon' | 'simulation';
type ViewMode = 'all' | 'byMember' | 'byRace';

interface RaceRecord {
 id: string;
 user_id: string;
 competition_type: 'hyrox' | 'marathon';
 event_id: string | null;
 event_name_en: string | null;
 event_name_ko: string | null;
 event_date: string | null;
 event_location: string | null;
 overall_time_seconds: number | null;
 workout_id: string | null;
 session_code: string | null;
 notes: string | null;
 created_at: string;
 users: {
  id: string;
  name: string;
  birth: string | null;
  profile_image_url: string | null;
 } | null;
 competition_events: {
  id: string;
  name_ko: string;
  name_en: string;
  competition_type: string;
  city_ko: string | null;
  country_ko: string | null;
 } | null;
 hyrox: {
  id: string;
  competition_id: string;
  is_simulation: boolean;
  division_id: string | null;
  run_1_seconds: number | null;
  run_2_seconds: number | null;
  run_3_seconds: number | null;
  run_4_seconds: number | null;
  run_5_seconds: number | null;
  run_6_seconds: number | null;
  run_7_seconds: number | null;
  run_8_seconds: number | null;
  station_1_seconds: number | null;
  station_2_seconds: number | null;
  station_3_seconds: number | null;
  station_4_seconds: number | null;
  station_5_seconds: number | null;
  station_6_seconds: number | null;
  station_7_seconds: number | null;
  station_8_seconds: number | null;
  roxzone_total_seconds: number | null;
  hyrox_divisions: {
   id: string;
   label_ko: string;
   label_en: string;
   category: string;
   level: string;
   gender: string;
  } | null;
 } | null;
 marathon: {
  id: string;
  competition_id: string;
  race_type: string;
  distance_km: number | null;
  weather: string | null;
  temperature_celsius: number | null;
  split_5k_seconds: number | null;
  split_10k_seconds: number | null;
  split_15k_seconds: number | null;
  split_20k_seconds: number | null;
  split_25k_seconds: number | null;
  split_30k_seconds: number | null;
  split_35k_seconds: number | null;
  split_40k_seconds: number | null;
  split_half_seconds: number | null;
 } | null;
 workout: {
  id: string;
  title: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number | null;
  distance: number | null;
  calories: number | null;
  points: number | null;
  intensity: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  note: string | null;
  workout_categories: {
   id: string;
   name_ko: string;
   name_en: string;
  } | null;
 } | null;
}

interface RaceResponse {
 records: RaceRecord[];
 summary: { total: number; hyrox: number; marathon: number; simulation: number };
}

interface MemberGroup {
 userId: string;
 name: string;
 birth: string | null;
 records: RaceRecord[];
 bestTime: number | null;
 recordCount: number;
}

interface RaceGroup {
 key: string;
 eventName: string;
 location: string | null;
 competitionType: 'hyrox' | 'marathon';
 division: string | null;
 raceType: string | null;
 isSimulation: boolean;
 sessionCode: string | null;
 latestDate: string | null;
 records: RaceRecord[];
 participantCount: number;
}

// ─── Helpers ─────────────────────────────────────────────
const formatTime = (seconds: number | null): string => {
 if (seconds === null || seconds === undefined) return '-';
 const h = Math.floor(seconds / 3600);
 const m = Math.floor((seconds % 3600) / 60);
 const s = Math.floor(seconds % 60);
 if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
 return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string | null): string => {
 if (!dateString) return '-';
 return new Date(dateString).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getAge = (birth: string | null): string => {
 if (!birth) return '-';
 return `${new Date().getFullYear() - new Date(birth).getFullYear()}세`;
};

const raceTypeLabels: Record<string, string> = {
 full: '풀코스', half: '하프', '10k': '10K', '5k': '5K', ultra: '울트라',
};

const weatherLabels: Record<string, string> = {
 sunny: '맑음', cloudy: '흐림', rainy: '비', snowy: '눈', windy: '바람', hot: '더움', cold: '추움',
};

function getEventName(record: RaceRecord): string {
 if (record.competition_events?.name_ko) return record.competition_events.name_ko;
 if (record.event_name_ko) return record.event_name_ko;
 if (record.event_name_en) return record.event_name_en;
 return record.competition_type === 'hyrox' ? 'HYROX' : '마라톤';
}

function getEventLocation(record: RaceRecord): string | null {
 if (record.competition_events?.city_ko) {
  const country = record.competition_events.country_ko;
  return country ? `${record.competition_events.city_ko}, ${country}` : record.competition_events.city_ko;
 }
 return record.event_location || null;
}

function getTypeBadge(record: RaceRecord) {
 if (record.competition_type === 'hyrox') {
  if (record.hyrox?.is_simulation) {
   return { label: '시뮬레이션', className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' };
  }
  return { label: 'HYROX', className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' };
 }
 const raceType = record.marathon?.race_type;
 const label = raceType ? raceTypeLabels[raceType] || raceType : '마라톤';
 return { label, className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' };
}

function getDivisionLabel(record: RaceRecord): string {
 return record.hyrox?.hyrox_divisions?.label_ko
  || (record.marathon?.race_type ? raceTypeLabels[record.marathon.race_type] || record.marathon.race_type : '-');
}

function getRaceGroupKey(record: RaceRecord): string {
 // Simulations: group by session_code (same session, different divisions)
 if (record.hyrox?.is_simulation) {
  const sessionPart = record.session_code || `nosession_${record.id}`;
  return `sim::${sessionPart}`;
 }
 // Official races & marathons: group by event + division/race type
 const eventPart = record.event_id || record.event_name_ko || record.event_name_en || record.competition_type;
 const divPart = record.hyrox?.hyrox_divisions?.id || record.marathon?.race_type || '';
 return `${eventPart}::${divPart}`;
}

// ─── Sub-components (splits, workout, etc.) ──────────────
function HyroxSplitsDetail({ hyrox }: { hyrox: NonNullable<RaceRecord['hyrox']> }) {
 const runs = [
  hyrox.run_1_seconds, hyrox.run_2_seconds, hyrox.run_3_seconds, hyrox.run_4_seconds,
  hyrox.run_5_seconds, hyrox.run_6_seconds, hyrox.run_7_seconds, hyrox.run_8_seconds,
 ];
 const stations = [
  hyrox.station_1_seconds, hyrox.station_2_seconds, hyrox.station_3_seconds, hyrox.station_4_seconds,
  hyrox.station_5_seconds, hyrox.station_6_seconds, hyrox.station_7_seconds, hyrox.station_8_seconds,
 ];
 const hasAnySplit = [...runs, ...stations].some((s) => s !== null);
 if (!hasAnySplit) return null;

 const totalRun = runs.reduce<number>((sum, r) => sum + (r || 0), 0);
 const totalStation = stations.reduce<number>((sum, s) => sum + (s || 0), 0);

 return (
  <div className="mt-3 space-y-3">
   <div className="flex gap-3 text-xs">
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400">
     <span className="font-medium">Run</span><span>{formatTime(totalRun)}</span>
    </div>
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/15 text-violet-700 dark:text-violet-400">
     <span className="font-medium">Station</span><span>{formatTime(totalStation)}</span>
    </div>
    {hyrox.roxzone_total_seconds && (
     <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
      <span className="font-medium">Roxzone</span><span>{formatTime(hyrox.roxzone_total_seconds)}</span>
     </div>
    )}
   </div>
   <div className="grid grid-cols-8 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden text-[11px]">
    {runs.map((r, i) => (
     <div key={`run-${i}`} className="bg-surface p-1.5 text-center">
      <div className="text-content-disabled font-medium mb-0.5">R{i + 1}</div>
      <div className="text-content-secondary tabular-nums">{formatTime(r)}</div>
     </div>
    ))}
    {stations.map((s, i) => (
     <div key={`station-${i}`} className="bg-surface p-1.5 text-center">
      <div className="text-content-disabled font-medium mb-0.5">S{i + 1}</div>
      <div className="text-content-secondary tabular-nums">{formatTime(s)}</div>
     </div>
    ))}
   </div>
  </div>
 );
}

function MarathonSplitsDetail({ marathon }: { marathon: NonNullable<RaceRecord['marathon']> }) {
 const splits = [
  { label: '5K', value: marathon.split_5k_seconds },
  { label: '10K', value: marathon.split_10k_seconds },
  { label: '15K', value: marathon.split_15k_seconds },
  { label: 'Half', value: marathon.split_half_seconds },
  { label: '20K', value: marathon.split_20k_seconds },
  { label: '25K', value: marathon.split_25k_seconds },
  { label: '30K', value: marathon.split_30k_seconds },
  { label: '35K', value: marathon.split_35k_seconds },
  { label: '40K', value: marathon.split_40k_seconds },
 ].filter((s) => s.value !== null);
 if (splits.length === 0) return null;

 return (
  <div className="mt-3">
   <div className="flex flex-wrap gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden text-[11px]">
    {splits.map((s) => (
     <div key={s.label} className="bg-surface p-1.5 text-center min-w-[60px] flex-1">
      <div className="text-content-disabled font-medium mb-0.5">{s.label}</div>
      <div className="text-content-secondary tabular-nums">{formatTime(s.value)}</div>
     </div>
    ))}
   </div>
   {marathon.weather && (
    <div className="mt-2 flex items-center gap-2 text-xs text-content-tertiary">
     <span>{weatherLabels[marathon.weather] || marathon.weather}</span>
     {marathon.temperature_celsius !== null && <span>{marathon.temperature_celsius}°C</span>}
    </div>
   )}
  </div>
 );
}

function WorkoutDetail({ workout }: { workout: NonNullable<RaceRecord['workout']> }) {
 const fmtDur = (s: number | null) => {
  if (!s) return '-';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
 };
 const fmtDist = (km: number | null) => km ? (km >= 1 ? `${km.toFixed(2)}km` : `${(km * 1000).toFixed(0)}m`) : null;
 const intensityLabel = (l: number | null) => l ? ['', '매우 가벼움', '가벼움', '보통', '힘듦', '매우 힘듦'][l] || `${l}` : null;
 const fmtRange = (start: string | null, end: string | null) => {
  if (!start) return null;
  const t = (d: string) => new Date(d).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return end ? `${t(start)} - ${t(end)}` : t(start);
 };

 return (
  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
   <div className="flex items-center gap-1.5 mb-2.5">
    <Dumbbell className="w-3.5 h-3.5 text-content-disabled" />
    <span className="text-[11px] font-semibold text-content-disabled uppercase tracking-wider">연결된 운동</span>
   </div>
   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
    <div className="flex items-center justify-between">
     <div className="text-sm font-medium text-slate-900 dark:text-white">
      {workout.title || workout.workout_categories?.name_ko || '운동'}
     </div>
     {workout.workout_categories?.name_ko && workout.title && workout.title !== workout.workout_categories.name_ko && (
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-content-secondary">
       {workout.workout_categories.name_ko}
      </span>
     )}
    </div>
    {fmtRange(workout.start_time, workout.end_time) && (
     <div className="text-xs text-content-tertiary">{fmtRange(workout.start_time, workout.end_time)}</div>
    )}
    <div className="grid grid-cols-2 gap-2 text-xs">
     {workout.duration_seconds && <div className="flex items-center gap-1.5"><Timer className="w-3 h-3 text-content-disabled" /><span className="text-content-secondary">{fmtDur(workout.duration_seconds)}</span></div>}
     {workout.distance && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-content-disabled" /><span className="text-content-secondary">{fmtDist(workout.distance)}</span></div>}
     {workout.calories && <div className="flex items-center gap-1.5"><Flame className="w-3 h-3 text-content-disabled" /><span className="text-content-secondary">{workout.calories}kcal</span></div>}
     {workout.points && <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-content-disabled" /><span className="text-content-secondary">{workout.points}pts</span></div>}
     {(workout.avg_heart_rate || workout.max_heart_rate) && (
      <div className="flex items-center gap-1.5">
       <Heart className="w-3 h-3 text-content-disabled" />
       <span className="text-content-secondary">
        {workout.avg_heart_rate && `평균 ${workout.avg_heart_rate}`}
        {workout.avg_heart_rate && workout.max_heart_rate && ' / '}
        {workout.max_heart_rate && `최대 ${workout.max_heart_rate}`}
       </span>
      </div>
     )}
     {workout.intensity && <div className="flex items-center gap-1.5"><span className="text-content-disabled text-[10px] font-medium">강도</span><span className="text-content-secondary">{intensityLabel(workout.intensity)}</span></div>}
    </div>
    {workout.note && (
     <div className="text-xs text-content-tertiary pt-1 border-t border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{workout.note}</div>
    )}
   </div>
  </div>
 );
}

function RecordDetailPanel({ record, onClose }: { record: RaceRecord; onClose: () => void }) {
 const badge = getTypeBadge(record);
 const location = getEventLocation(record);
 return (
  <div className="bg-surface rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
   <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-100 dark:border-slate-800">
    <div className="flex-1 min-w-0">
     <div className="flex items-center gap-2.5 mb-2">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
       {record.users?.name?.charAt(0) || '?'}
      </div>
      <div>
       <div className="font-semibold text-sm text-slate-900 dark:text-white">{record.users?.name || '알 수 없음'}</div>
       <div className="text-xs text-content-tertiary">{getAge(record.users?.birth || null)}</div>
      </div>
     </div>
     <div className="flex items-center gap-2 flex-wrap">
      <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
      {record.hyrox?.hyrox_divisions?.label_ko && <span className="text-xs text-content-secondary">{record.hyrox.hyrox_divisions.label_ko}</span>}
     </div>
    </div>
    <button onClick={onClose} className="p-1.5 -mr-1.5 -mt-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
     <X className="w-4 h-4 text-content-tertiary" />
    </button>
   </div>
   <div className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-4">
     <div>
      <div className="text-[11px] font-medium text-content-disabled mb-1">대회</div>
      <div className="text-sm font-medium text-slate-900 dark:text-white">{getEventName(record)}</div>
      {location && <div className="flex items-center gap-1 mt-0.5 text-xs text-content-tertiary"><MapPin className="w-3 h-3" />{location}</div>}
     </div>
     <div>
      <div className="text-[11px] font-medium text-content-disabled mb-1">기록</div>
      <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{formatTime(record.overall_time_seconds)}</div>
      <div className="text-xs text-content-tertiary mt-0.5">{formatDate(record.event_date)}</div>
     </div>
    </div>
    {record.hyrox && <HyroxSplitsDetail hyrox={record.hyrox} />}
    {record.marathon && <MarathonSplitsDetail marathon={record.marathon} />}
    {record.workout && <WorkoutDetail workout={record.workout} />}
    {record.notes && (
     <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="text-[11px] font-medium text-content-disabled mb-1">메모</div>
      <p className="text-sm text-content-secondary whitespace-pre-wrap">{record.notes}</p>
     </div>
    )}
   </div>
  </div>
 );
}

// ─── Compact record row (reused in member/race views) ────
function CompactRecordRow({ record, isSelected, onSelect }: { record: RaceRecord; isSelected: boolean; onSelect: () => void }) {
 const badge = getTypeBadge(record);
 return (
  <div
   onClick={onSelect}
   className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
    isSelected ? 'bg-slate-100 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
   }`}
  >
   <div className="flex items-center gap-2 min-w-0 flex-1">
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded flex-shrink-0 ${badge.className}`}>{badge.label}</span>
    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{getEventName(record)}</span>
    {record.workout && <Dumbbell className="w-3 h-3 text-content-disabled flex-shrink-0" />}
   </div>
   <div className="flex items-center gap-3 flex-shrink-0">
    <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatTime(record.overall_time_seconds)}</span>
    <span className="text-xs text-content-disabled tabular-nums w-20 text-right">{formatDate(record.event_date)}</span>
   </div>
  </div>
 );
}

// ─── Sort icon ───────────────────────────────────────────
function SortButton({ label, sortKey, currentSort, asc, onSort }: {
 label: string; sortKey: string; currentSort: string; asc: boolean; onSort: (key: string) => void;
}) {
 const active = currentSort === sortKey;
 return (
  <button
   onClick={() => onSort(sortKey)}
   className={`flex items-center gap-0.5 text-xs font-medium transition-colors ${active ? 'text-content-primary' : 'text-content-disabled hover:text-content-secondary'}`}
  >
   {label}
   {active ? (asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronDown className="w-3 h-3 opacity-30" />}
  </button>
 );
}

// ─── Filter tabs ─────────────────────────────────────────
const filterTabs: { key: CompetitionFilter; label: string }[] = [
 { key: 'all', label: '전체' },
 { key: 'hyrox', label: 'HYROX' },
 { key: 'marathon', label: '마라톤' },
 { key: 'simulation', label: '시뮬레이션' },
];

const viewModes: { key: ViewMode; label: string; icon: typeof List }[] = [
 { key: 'all', label: '전체 기록', icon: List },
 { key: 'byMember', label: '멤버별', icon: Users },
 { key: 'byRace', label: '대회별', icon: FolderOpen },
];

// ─── Apply type filter ───────────────────────────────────
function applyFilter(records: RaceRecord[], filter: CompetitionFilter): RaceRecord[] {
 switch (filter) {
  case 'hyrox': return records.filter((r) => r.competition_type === 'hyrox' && !r.hyrox?.is_simulation);
  case 'marathon': return records.filter((r) => r.competition_type === 'marathon');
  case 'simulation': return records.filter((r) => r.hyrox?.is_simulation);
  default: return records;
 }
}

// ─── Main Page ───────────────────────────────────────────
export default function RacePage() {
 const params = useParams();
 const challengeId = params.challengeId as string;
 const { challenges } = useChallenge();
 const currentChallenge = challenges?.find((c) => c.challenges.id === challengeId);

 const queryClient = useQueryClient();
 const [filter, setFilter] = useState<CompetitionFilter>('all');
 const [viewMode, setViewMode] = useState<ViewMode>('all');
 const [selectedRecord, setSelectedRecord] = useState<RaceRecord | null>(null);
 const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
 const [mergeTarget, setMergeTarget] = useState<{ groupKey: string; recordIds: string[] } | null>(null);

 // Sort states per view
 const [allSort, setAllSort] = useState<{ key: string; asc: boolean }>({ key: 'date', asc: false });
 const [memberSort, setMemberSort] = useState<{ key: string; asc: boolean }>({ key: 'count', asc: false });
 const [raceSort, setRaceSort] = useState<{ key: string; asc: boolean }>({ key: 'date', asc: false });

 const { data, isLoading } = useQuery<RaceResponse>({
  queryKey: ['race-records', challengeId],
  queryFn: async () => {
   const res = await fetch(`/api/challenges/${challengeId}/race`);
   if (!res.ok) throw new Error('Failed to fetch race records');
   return res.json();
  },
 });

 // ── Session merge mutation ──
 const mergeMutation = useMutation({
  mutationFn: async ({ recordIds, targetSessionCode }: { recordIds: string[]; targetSessionCode: string }) => {
   const res = await fetch(`/api/challenges/${challengeId}/race`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record_ids: recordIds, target_session_code: targetSessionCode }),
   });
   if (!res.ok) throw new Error('Failed to merge sessions');
   return res.json();
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['race-records', challengeId] });
   setMergeTarget(null);
  },
 });

 const filteredRecords = useMemo(() => applyFilter(data?.records || [], filter), [data?.records, filter]);

 // ── All records (sorted) ──
 const sortedAllRecords = useMemo(() => {
  return [...filteredRecords].sort((a, b) => {
   const { key, asc } = allSort;
   if (key === 'date') {
    const dA = a.event_date ? new Date(a.event_date).getTime() : 0;
    const dB = b.event_date ? new Date(b.event_date).getTime() : 0;
    return asc ? dA - dB : dB - dA;
   }
   if (key === 'time') {
    const tA = a.overall_time_seconds ?? Infinity;
    const tB = b.overall_time_seconds ?? Infinity;
    return asc ? tA - tB : tB - tA;
   }
   if (key === 'name') {
    const nA = a.users?.name || '';
    const nB = b.users?.name || '';
    return asc ? nA.localeCompare(nB) : nB.localeCompare(nA);
   }
   return 0;
  });
 }, [filteredRecords, allSort]);

 // ── Member groups ──
 const memberGroups = useMemo((): MemberGroup[] => {
  const map = new Map<string, MemberGroup>();
  for (const r of filteredRecords) {
   const uid = r.user_id;
   let g = map.get(uid);
   if (!g) {
    g = { userId: uid, name: r.users?.name || '알 수 없음', birth: r.users?.birth || null, records: [], bestTime: null, recordCount: 0 };
    map.set(uid, g);
   }
   g.records.push(r);
   g.recordCount++;
   if (r.overall_time_seconds !== null) {
    if (g.bestTime === null || r.overall_time_seconds < g.bestTime) g.bestTime = r.overall_time_seconds;
   }
  }
  // Sort member records by date desc within each group
  for (const g of map.values()) {
   g.records.sort((a, b) => {
    const dA = a.event_date ? new Date(a.event_date).getTime() : 0;
    const dB = b.event_date ? new Date(b.event_date).getTime() : 0;
    return dB - dA;
   });
  }
  const groups = Array.from(map.values());
  const { key, asc } = memberSort;
  groups.sort((a, b) => {
   if (key === 'name') return asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
   if (key === 'count') return asc ? a.recordCount - b.recordCount : b.recordCount - a.recordCount;
   if (key === 'best') {
    const tA = a.bestTime ?? Infinity;
    const tB = b.bestTime ?? Infinity;
    return asc ? tA - tB : tB - tA;
   }
   return 0;
  });
  return groups;
 }, [filteredRecords, memberSort]);

 // ── Race groups ──
 const raceGroups = useMemo((): RaceGroup[] => {
  const map = new Map<string, RaceGroup>();
  for (const r of filteredRecords) {
   const key = getRaceGroupKey(r);
   let g = map.get(key);
   if (!g) {
    g = {
     key,
     eventName: getEventName(r),
     location: getEventLocation(r),
     competitionType: r.competition_type,
     division: r.hyrox?.is_simulation ? null : (r.hyrox?.hyrox_divisions?.label_ko || null),
     raceType: r.marathon?.race_type ? raceTypeLabels[r.marathon.race_type] || r.marathon.race_type : null,
     isSimulation: !!r.hyrox?.is_simulation,
     sessionCode: r.session_code || null,
     latestDate: r.event_date,
     records: [],
     participantCount: 0,
    };
    map.set(key, g);
   }
   g.records.push(r);
   if (r.event_date && (!g.latestDate || r.event_date > g.latestDate)) g.latestDate = r.event_date;
  }
  // Sort records within group by time (leaderboard)
  for (const g of map.values()) {
   g.records.sort((a, b) => (a.overall_time_seconds ?? Infinity) - (b.overall_time_seconds ?? Infinity));
   g.participantCount = new Set(g.records.map((r) => r.user_id)).size;
  }
  const groups = Array.from(map.values());
  const { key, asc } = raceSort;
  groups.sort((a, b) => {
   if (key === 'date') {
    const dA = a.latestDate ? new Date(a.latestDate).getTime() : 0;
    const dB = b.latestDate ? new Date(b.latestDate).getTime() : 0;
    return asc ? dA - dB : dB - dA;
   }
   if (key === 'participants') return asc ? a.participantCount - b.participantCount : b.participantCount - a.participantCount;
   if (key === 'records') return asc ? a.records.length - b.records.length : b.records.length - a.records.length;
   return 0;
  });
  return groups;
 }, [filteredRecords, raceSort]);

 const handleSortToggle = (setter: typeof setAllSort, current: { key: string; asc: boolean }, newKey: string) => {
  if (current.key === newKey) setter({ key: newKey, asc: !current.asc });
  else setter({ key: newKey, asc: newKey === 'name' ? true : newKey === 'best' || newKey === 'time' ? true : false });
 };

 const toggleGroup = (key: string) => setExpandedGroup(expandedGroup === key ? null : key);

 if (isLoading) {
  return (
   <div className="flex-1 p-4 sm:p-2">
    <div className="max-w-6xl mx-auto px-4 pt-4 sm:px-1 sm:pt-3">
     <div className="animate-pulse space-y-6">
      <div className="space-y-2">
       <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
       <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64" />
      </div>
      <div className="flex gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl flex-1" />)}</div>
      <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}</div>
     </div>
    </div>
   </div>
  );
 }

 const summary = data?.summary || { total: 0, hyrox: 0, marathon: 0, simulation: 0 };

 return (
  <div className="flex-1 p-4 sm:p-2">
   <div className="max-w-6xl mx-auto px-4 pt-4 sm:px-1 sm:pt-3">
    {/* Header */}
    {currentChallenge && (
     <div className="text-body text-content-tertiary mb-2">
      {new Date(currentChallenge.challenges.start_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(currentChallenge.challenges.end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
     </div>
    )}
    <div className="text-content-tertiary text-headline font-bold mb-2">{currentChallenge?.challenges.title || ''}</div>
    <Title title="대회/시뮬레이션" />

    {/* Summary Cards */}
    <div className="grid grid-cols-4 gap-3 mt-6 sm:grid-cols-2 sm:mt-4">
     {[
      { label: '전체 기록', value: summary.total, icon: <Trophy className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-100 dark:bg-slate-800' },
      { label: 'HYROX', value: summary.hyrox, icon: <span className="text-xs font-bold text-red-600 dark:text-red-400">H</span>, bg: 'bg-red-50 dark:bg-red-900/20' },
      { label: '마라톤', value: summary.marathon, icon: <span className="text-xs font-bold text-blue-600 dark:text-blue-400">M</span>, bg: 'bg-blue-50 dark:bg-blue-900/20' },
      { label: '시뮬레이션', value: summary.simulation, icon: <Timer className="w-4 h-4 text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
     ].map((card) => (
      <div key={card.label} className="bg-surface rounded-xl border border-slate-100 dark:border-slate-800 p-4 sm:p-3">
       <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>{card.icon}</div>
        <span className="text-[11px] font-medium text-content-disabled">{card.label}</span>
       </div>
       <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{card.value}</div>
      </div>
     ))}
    </div>

    {/* View Mode Switcher + Filter Tabs */}
    <div className="mt-6 sm:mt-4 space-y-3">
     {/* View modes */}
     <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      {viewModes.map(({ key, label, icon: Icon }) => (
       <button
        key={key}
        onClick={() => { setViewMode(key); setSelectedRecord(null); setExpandedGroup(null); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
         viewMode === key
          ? 'bg-surface text-slate-900 dark:text-white shadow-sm'
          : 'text-content-tertiary hover:text-content-secondary'
        }`}
       >
        <Icon className="w-3.5 h-3.5" />
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{label}</span>
       </button>
      ))}
     </div>

     {/* Type filter */}
     <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-px">
      {filterTabs.map((tab) => (
       <button
        key={tab.key}
        onClick={() => { setFilter(tab.key); setExpandedGroup(null); }}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative sm:flex-1 sm:text-center ${
         filter === tab.key ? 'text-slate-900 dark:text-white bg-surface' : 'text-content-tertiary hover:text-content-secondary hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
       >
        {tab.label}
        {filter === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />}
       </button>
      ))}
     </div>
    </div>

    {/* Content */}
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
     <div className={selectedRecord ? 'lg:col-span-2' : 'lg:col-span-3'}>
      {filteredRecords.length === 0 ? (
       <div className="bg-surface rounded-xl border border-slate-100 dark:border-slate-800 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
         <Trophy className="w-5 h-5 text-content-disabled" />
        </div>
        <p className="text-sm text-content-tertiary">
         {filter === 'all' ? '아직 대회 기록이 없습니다' : `${filterTabs.find(t => t.key === filter)?.label} 기록이 없습니다`}
        </p>
       </div>
      ) : viewMode === 'all' ? (
       /* ── All records view ── */
       <div className="bg-surface rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Sort bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
         <span className="text-[11px] text-content-disabled mr-1">정렬</span>
         <SortButton label="날짜" sortKey="date" currentSort={allSort.key} asc={allSort.asc} onSort={(k) => handleSortToggle(setAllSort, allSort, k)} />
         <SortButton label="기록" sortKey="time" currentSort={allSort.key} asc={allSort.asc} onSort={(k) => handleSortToggle(setAllSort, allSort, k)} />
         <SortButton label="이름" sortKey="name" currentSort={allSort.key} asc={allSort.asc} onSort={(k) => handleSortToggle(setAllSort, allSort, k)} />
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
         {sortedAllRecords.map((record) => {
          const badge = getTypeBadge(record);
          const isSelected = selectedRecord?.id === record.id;
          return (
           <div
            key={record.id}
            onClick={() => setSelectedRecord(isSelected ? null : record)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
             isSelected ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
            }`}
           >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
             {record.users?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{record.users?.name || '알 수 없음'}</span>
              <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${badge.className}`}>{badge.label}</span>
              {record.workout && <Dumbbell className="w-3 h-3 text-content-disabled flex-shrink-0" />}
             </div>
             <div className="text-xs text-content-tertiary truncate mt-0.5">
              {getEventName(record)}{getDivisionLabel(record) !== '-' ? ` · ${getDivisionLabel(record)}` : ''}
             </div>
            </div>
            <div className="text-right flex-shrink-0">
             <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatTime(record.overall_time_seconds)}</div>
             <div className="text-[11px] text-content-disabled tabular-nums">{formatDate(record.event_date)}</div>
            </div>
           </div>
          );
         })}
        </div>
       </div>
      ) : viewMode === 'byMember' ? (
       /* ── Member view ── */
       <div className="space-y-3">
        {/* Sort bar */}
        <div className="flex items-center gap-3 px-1">
         <span className="text-[11px] text-content-disabled mr-1">정렬</span>
         <SortButton label="이름" sortKey="name" currentSort={memberSort.key} asc={memberSort.asc} onSort={(k) => handleSortToggle(setMemberSort, memberSort, k)} />
         <SortButton label="기록 수" sortKey="count" currentSort={memberSort.key} asc={memberSort.asc} onSort={(k) => handleSortToggle(setMemberSort, memberSort, k)} />
         <SortButton label="베스트" sortKey="best" currentSort={memberSort.key} asc={memberSort.asc} onSort={(k) => handleSortToggle(setMemberSort, memberSort, k)} />
        </div>
        {memberGroups.map((group) => {
         const isOpen = expandedGroup === group.userId;
         return (
          <div key={group.userId} className="bg-surface rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
           <button
            onClick={() => toggleGroup(group.userId)}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
           >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
             {group.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
             <div className="text-sm font-semibold text-slate-900 dark:text-white">{group.name}</div>
             <div className="text-xs text-content-tertiary">{getAge(group.birth)} · {group.recordCount}개 기록</div>
            </div>
            <div className="text-right flex-shrink-0 mr-2">
             <div className="text-[11px] text-content-disabled">베스트</div>
             <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatTime(group.bestTime)}</div>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-content-disabled flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-content-disabled flex-shrink-0" />}
           </button>
           {isOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-1.5">
             {group.records.map((record) => (
              <CompactRecordRow
               key={record.id}
               record={record}
               isSelected={selectedRecord?.id === record.id}
               onSelect={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
              />
             ))}
            </div>
           )}
          </div>
         );
        })}
       </div>
      ) : (
       /* ── Race view ── */
       <div className="space-y-3">
        {/* Sort bar */}
        <div className="flex items-center gap-3 px-1">
         <span className="text-[11px] text-content-disabled mr-1">정렬</span>
         <SortButton label="날짜" sortKey="date" currentSort={raceSort.key} asc={raceSort.asc} onSort={(k) => handleSortToggle(setRaceSort, raceSort, k)} />
         <SortButton label="참가자 수" sortKey="participants" currentSort={raceSort.key} asc={raceSort.asc} onSort={(k) => handleSortToggle(setRaceSort, raceSort, k)} />
         <SortButton label="기록 수" sortKey="records" currentSort={raceSort.key} asc={raceSort.asc} onSort={(k) => handleSortToggle(setRaceSort, raceSort, k)} />
        </div>
        {raceGroups.map((group) => {
         const isOpen = expandedGroup === group.key;
         const typeBadge = group.competitionType === 'hyrox'
          ? (group.records.some(r => r.hyrox?.is_simulation)
           ? { label: '시뮬레이션', className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' }
           : { label: 'HYROX', className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' })
          : { label: group.raceType || '마라톤', className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' };
         const isMerging = mergeTarget?.groupKey === group.key;
         const otherSimGroups = group.isSimulation
          ? raceGroups.filter((g) => g.isSimulation && g.key !== group.key)
          : [];

         return (
          <div key={group.key} className="bg-surface rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
           <button
            onClick={() => toggleGroup(group.key)}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
           >
            <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{group.eventName}</span>
              <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${typeBadge.className}`}>{typeBadge.label}</span>
              {group.isSimulation && group.sessionCode && (
               <span className="text-[10px] text-content-disabled font-mono">{group.sessionCode}</span>
              )}
             </div>
             <div className="flex items-center gap-2 text-xs text-content-tertiary">
              {group.division && <span>{group.division}</span>}
              {group.location && <><span>·</span><span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{group.location}</span></>}
              <span>·</span>
              <span>{formatDate(group.latestDate)}</span>
             </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 mr-2">
             <div className="text-center">
              <div className="text-[11px] text-content-disabled">참가</div>
              <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{group.participantCount}</div>
             </div>
             <div className="text-center">
              <div className="text-[11px] text-content-disabled">기록</div>
              <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{group.records.length}</div>
             </div>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-content-disabled flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-content-disabled flex-shrink-0" />}
           </button>
           {isOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800">
             {/* Merge controls for simulation groups */}
             {group.isSimulation && otherSimGroups.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
               {isMerging ? (
                <div className="flex items-center gap-2 flex-wrap">
                 <span className="text-xs text-content-secondary">이동할 세션:</span>
                 <div className="flex items-center gap-1.5 flex-wrap">
                  {otherSimGroups.map((target) => (
                   <button
                    key={target.key}
                    disabled={mergeMutation.isPending}
                    onClick={() => {
                     if (!target.sessionCode) return;
                     mergeMutation.mutate({
                      recordIds: group.records.map((r) => r.id),
                      targetSessionCode: target.sessionCode,
                     });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-surface border border-slate-200 dark:border-slate-700 text-content-secondary hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
                   >
                    <span>{target.eventName}</span>
                    {target.sessionCode && <span className="font-mono text-[10px] text-content-disabled">{target.sessionCode}</span>}
                    <span className="text-content-disabled">({target.records.length}건)</span>
                   </button>
                  ))}
                 </div>
                 <button
                  onClick={() => setMergeTarget(null)}
                  className="ml-auto text-xs text-content-disabled hover:text-content-secondary transition-colors"
                 >
                  취소
                 </button>
                </div>
               ) : (
                <button
                 onClick={(e) => {
                  e.stopPropagation();
                  setMergeTarget({ groupKey: group.key, recordIds: group.records.map((r) => r.id) });
                 }}
                 className="flex items-center gap-1.5 text-xs font-medium text-content-tertiary hover:text-content-secondary transition-colors"
                >
                 <Merge className="w-3.5 h-3.5" />
                 <span>다른 세션으로 합치기</span>
                </button>
               )}
               {mergeMutation.isPending && isMerging && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 dark:text-blue-400">
                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
                 <span>세션 합치는 중...</span>
                </div>
               )}
              </div>
             )}
             <div className="px-2 py-1.5">
              {group.records.map((record, idx) => (
               <div
                key={record.id}
                onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                 selectedRecord?.id === record.id ? 'bg-slate-100 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
               >
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-semibold text-content-secondary flex-shrink-0">
                 {idx + 1}
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
                 {record.users?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{record.users?.name || '알 수 없음'}</span>
                  <span className="text-xs text-content-disabled">{getAge(record.users?.birth || null)}</span>
                 </div>
                 {record.hyrox?.is_simulation && record.hyrox?.hyrox_divisions?.label_ko && (
                  <div className="text-[11px] text-content-tertiary">{record.hyrox.hyrox_divisions.label_ko}</div>
                 )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                 {record.workout && <Dumbbell className="w-3 h-3 text-content-disabled" />}
                 <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatTime(record.overall_time_seconds)}</span>
                 <span className="text-xs text-content-disabled tabular-nums w-20 text-right">{formatDate(record.event_date)}</span>
                </div>
               </div>
              ))}
             </div>
            </div>
           )}
          </div>
         );
        })}
       </div>
      )}
     </div>

     {/* Detail Panel (Desktop) */}
     {selectedRecord && (
      <div className="hidden lg:block lg:col-span-1 sticky top-20 self-start">
       <RecordDetailPanel record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      </div>
     )}
    </div>

    {/* TODO: 후속 기능 */}
    {/* - 코치 피드백/코멘트 */}
    {/* - 개인별 기록 추이 차트 */}
    {/* - 챌린지 내 리더보드 */}
    {/* - 스플릿 분석 & 인사이트 */}
   </div>
  </div>
 );
}
