import React, { useState, useEffect } from 'react';
import { Target, Flame, CheckSquare, Award, Activity, AlertTriangle, XCircle } from 'lucide-react';
import commitmentApi from '../api/commitmentApi';
import weeklyDataApi from '../api/weeklyDataApi';
import dailyDataApi from '../api/dailyDataApi';
import milestoneApi from '../api/milestoneApi';
import { getLocalToday, getCurrentWeek } from '../utils/weekUtils';

const Dashboard = ({ wigs, selectedWigId, onSelectWig, onWigChange, refreshKey }) => {
    const [commitments, setCommitments] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [todayDailyData, setTodayDailyData] = useState(null);
    const [streakData, setStreakData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [localMilestones, setLocalMilestones] = useState([]);

    const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];

    const currentWeek = getCurrentWeek(selectedWig);

    useEffect(() => {
        if (selectedWig?.milestones) {
            setLocalMilestones(selectedWig.milestones);
        }
    }, [selectedWig?.id, selectedWig?.milestones]);

    useEffect(() => {
        if (selectedWigId) {
            loadData();
        }
    }, [selectedWigId, refreshKey, currentWeek]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [commitmentsData, weeklyDataResult, streakResult] = await Promise.all([
                commitmentApi.getByWigIdAndWeek(selectedWigId, currentWeek),
                weeklyDataApi.getByWigId(selectedWigId),
                dailyDataApi.getStreak(selectedWigId).catch(() => null)
            ]);
            setCommitments(commitmentsData);
            setWeeklyData(weeklyDataResult);
            setStreakData(streakResult);

            try {
                const today = getLocalToday();
                const dailyResult = await dailyDataApi.getByDateRange(selectedWigId, today, today);
                setTodayDailyData(dailyResult && dailyResult.length > 0 ? dailyResult[0] : null);
            } catch (err) {
                console.error('일간 데이터 로드 실패:', err);
                setTodayDailyData(null);
            }
        } catch (err) {
            console.error('데이터 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    const getLagProgress = () => {
        if (!selectedWig) return 0;

        if (selectedWig.measureType === 'STATE') {
            if (!localMilestones || localMilestones.length === 0) return 0;
            const completed = localMilestones.filter(m => m.completed).length;
            return ((completed / localMilestones.length) * 100).toFixed(1);
        } else {
            const latest = weeklyData.length > 0
                ? weeklyData.sort((a, b) => b.week.localeCompare(a.week))[0]
                : null;
            if (!latest || !latest.actual) return 0;

            const from = parseFloat(selectedWig.fromX) || 0;
            const to = parseFloat(selectedWig.toY) || 0;
            const current = latest.actual;

            if (from === to) return 100;
            if (from > to) {
                return Math.min(100, Math.max(0, ((from - current) / (from - to)) * 100)).toFixed(1);
            }
            return Math.min(100, Math.max(0, ((current - from) / (to - from)) * 100)).toFixed(1);
        }
    };

    const getCurrentLagValue = () => {
        if (!selectedWig) return '-';

        if (selectedWig.measureType === 'STATE') {
            const completed = localMilestones?.filter(m => m.completed).length || 0;
            const total = localMilestones?.length || 0;
            return `${completed}/${total} 완료`;
        } else {
            const latest = weeklyData.length > 0
                ? weeklyData.sort((a, b) => b.week.localeCompare(a.week))[0]
                : null;
            if (latest?.actual) {
                return `${latest.actual} ${selectedWig.unit}`;
            }
            return `${selectedWig.fromX} ${selectedWig.unit}`;
        }
    };

    const handleMilestoneToggle = async (milestoneId) => {
        try {
            const result = await milestoneApi.toggleCompleted(milestoneId);

            setLocalMilestones(prev =>
                prev.map(m =>
                    m.id === milestoneId
                        ? { ...m, completed: result.completed }
                        : m
                )
            );
        } catch (err) {
            console.error('마일스톤 토글 실패:', err);
            alert('마일스톤 상태 변경에 실패했습니다.');
        }
    };

    const lagProgress = getLagProgress();
    const completedCommitments = commitments.filter(c => c.completed).length;
    const totalCommitments = commitments.length;

    if (!selectedWig) return null;

    return (
        <div className="space-y-6">
            {/* WIG 선택 탭 */}
            <div className="flex space-x-4 overflow-x-auto pb-2">
                {wigs.map(wig => (
                    <button
                        key={wig.id}
                        onClick={() => onSelectWig(wig.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedWig.id === wig.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        {wig.title}
                    </button>
                ))}
            </div>

            {/* WIG 헤더 (Lag Measure) */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{selectedWig.title}</h2>
                        <div className="flex items-center space-x-3 text-lg">
                            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full">
                                {selectedWig.fromX}
                            </span>
                            <span>→</span>
                            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full">
                                {selectedWig.toY}
                            </span>
                        </div>
                        <p className="mt-2 text-sm opacity-90">목표일: {selectedWig.byWhen}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedWig.measureType === 'NUMERIC' ? 'bg-green-400' : 'bg-yellow-400'
                    } text-gray-900`}>
                        {selectedWig.measureType === 'NUMERIC' ? '수치형' : '상태형'}
                    </span>
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-semibold">
                            현재: {getCurrentLagValue()}
                        </span>
                        <span className="text-lg font-bold">{lagProgress}%</span>
                    </div>
                    <div className="w-full bg-white bg-opacity-30 rounded-full h-4">
                        <div
                            className="bg-white rounded-full h-4 transition-all duration-500"
                            style={{ width: `${Math.min(100, lagProgress)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 요약 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">연속 달성</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {streakData ? streakData.overallStreak : 0}일
                            </p>
                        </div>
                        <Flame className={streakData?.overallStreak > 0 ? 'text-orange-500' : 'text-gray-300'} size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">현재 주차</p>
                            <p className="text-2xl font-bold text-gray-800">{currentWeek}</p>
                        </div>
                        <Target className="text-green-500" size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">이번 주 약속 ({currentWeek})</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {completedCommitments}/{totalCommitments}
                            </p>
                        </div>
                        <CheckSquare className="text-purple-500" size={32} />
                    </div>
                </div>
            </div>

            {/* ═══ Lead Measures 분리 렌더링 (MAXIMIZE: 바 / MINIMIZE: 카드) ═══ */}
            {selectedWig.leadMeasures && selectedWig.leadMeasures.length > 0 && (() => {
                const maximizeLeads = [];
                const minimizeLeads = [];

                selectedWig.leadMeasures.forEach((lead, idx) => {
                    const dailyActual = todayDailyData?.leadValues?.[lead.id] ?? 0;
                    const enriched = { ...lead, dailyActual, idx };

                    if (lead.goalDirection === 'MINIMIZE') {
                        minimizeLeads.push(enriched);
                    } else {
                        maximizeLeads.push(enriched);
                    }
                });

                return (
                    <>
                        {/* ━━━ MAXIMIZE: 기존 무지개 프로그레스바 ━━━ */}
                        {maximizeLeads.length > 0 && (
                            <div className="bg-white p-4 rounded-lg shadow">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Activity className="text-blue-500" size={18} />
                                    Lead Measures (높을수록 좋음) - 오늘
                                </h3>
                                <div className="space-y-3">
                                    {maximizeLeads.map((lead) => {
                                        const barProgress = lead.dailyTarget
                                            ? ((lead.dailyActual || 0) / lead.dailyTarget * 100)
                                            : 0;
                                        const isGood = barProgress >= 100;
                                        const leadStreak = streakData?.leadMeasureStreaks?.find(s => s.leadMeasureId === lead.id);
                                        const streak = leadStreak?.currentStreak || 0;

                                        return (
                                            <div key={lead.id} className="flex items-center gap-4">
                                                <div className="w-36 flex-shrink-0">
                                                    <span className="font-medium text-gray-700">{lead.name}</span>
                                                    <span className="text-xs ml-1 text-green-500">↑</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                                        <div
                                                            className="h-3 rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(100, barProgress)}%`,
                                                                background: barProgress >= 100
                                                                    ? 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #a855f7)'
                                                                    : barProgress >= 85 ? '#a855f7'
                                                                        : barProgress >= 70 ? '#6366f1'
                                                                            : barProgress >= 55 ? '#3b82f6'
                                                                                : barProgress >= 40 ? '#22c55e'
                                                                                    : barProgress >= 25 ? '#eab308'
                                                                                        : barProgress >= 10 ? '#f97316'
                                                                                            : '#ef4444'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-32 text-right flex-shrink-0">
                                                    {lead.leadMeasureType === 'BOOLEAN' ? (
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                                            (lead.dailyActual || 0) >= 1
                                                                ? 'bg-green-100 text-green-600'
                                                                : 'bg-red-50 text-red-400'
                                                        }`}>
                                                            {(lead.dailyActual || 0) >= 1 ? 'O' : 'X'}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className={`text-sm ${isGood ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                                                {lead.dailyActual || 0} {lead.unit}
                                                            </span>
                                                            <span className="text-xs text-gray-400 ml-1">
                                                                ({barProgress.toFixed(0)}%)
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="w-14 flex-shrink-0 flex items-center justify-end gap-1">
                                                    <span className={`text-sm font-semibold ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                                                        🔥{streak}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ━━━ MINIMIZE: 미세먼지 스타일 카드 (미만/주의/초과) ━━━ */}
                        {minimizeLeads.length > 0 && (
                            <div className="bg-white p-4 rounded-lg shadow">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Activity className="text-orange-500" size={18} />
                                    Lead Measures (낮을수록 좋음) - 오늘
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {minimizeLeads.map((lead) => {
                                        const target = lead.dailyTarget || 1;
                                        const ratio = lead.dailyActual / target;
                                        const isOver = ratio > 1;
                                        const isNearLimit = !isOver && ratio >= 0.9;
                                        const leadStreak = streakData?.leadMeasureStreaks?.find(s => s.leadMeasureId === lead.id);
                                        const streak = leadStreak?.currentStreak || 0;

                                        // 3단계: 미만/주의/초과 — 초과만 빨강 카드, 나머지는 초록
                                        const grade = isOver
                                            ? {
                                                label: '초과',
                                                bg: '#FCEBEB', text: '#501313', sub: '#A32D2D',
                                                badge: '#F7C1C1', badgeText: '#791F1F',
                                                border: '#E24B4A',
                                            }
                                            : isNearLimit
                                                ? {
                                                    label: '주의',
                                                    bg: '#EAF3DE', text: '#173404', sub: '#3B6D11',
                                                    badge: '#FAC775', badgeText: '#633806',
                                                    border: '#EF9F27',
                                                }
                                                : {
                                                    label: '미만',
                                                    bg: '#EAF3DE', text: '#173404', sub: '#3B6D11',
                                                    badge: '#C0DD97', badgeText: '#27500A',
                                                    border: 'transparent',
                                                };

                                        return (
                                            <div
                                                key={lead.id}
                                                className={`rounded-xl p-4 text-center relative transition-all duration-500 ${
                                                    ''
                                                }`}
                                                style={{
                                                    backgroundColor: grade.bg,
                                                    border: grade.border !== 'transparent' ? `2px solid ${grade.border}` : '2px solid transparent',
                                                }}
                                            >
                                                {/* 주의: 주황 동그라미 느낌표 */}
                                                {isNearLimit && (
                                                    <div
                                                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                                                        style={{ backgroundColor: '#EF9F27' }}
                                                    >
                                                        <span className="text-white text-sm font-bold leading-none">!</span>
                                                    </div>
                                                )}

                                                {/* 초과: 빨강 동그라미 X */}
                                                {isOver && (
                                                    <div
                                                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                                                        style={{ backgroundColor: '#E24B4A' }}
                                                    >
                                                        <XCircle size={16} className="text-white" />
                                                    </div>
                                                )}

                                                {/* 지표명 */}
                                                <p
                                                    className="text-xs font-medium mb-1 truncate"
                                                    style={{ color: grade.sub }}
                                                    title={lead.name}
                                                >
                                                    {lead.name}
                                                </p>

                                                {/* 현재 수치 (크게) */}
                                                <p
                                                    className="text-2xl font-bold leading-tight"
                                                    style={{ color: grade.text }}
                                                >
                                                    {lead.dailyActual || 0}
                                                </p>

                                                {/* 한도 */}
                                                <p
                                                    className="text-xs mt-1"
                                                    style={{ color: grade.sub }}
                                                >
                                                    / {target} {lead.unit}
                                                </p>

                                                {/* 등급 뱃지 + streak */}
                                                <div className="mt-2 flex items-center justify-center gap-2">
                                                    <span
                                                        className="text-xs font-semibold px-3 py-0.5 rounded-full"
                                                        style={{
                                                            backgroundColor: grade.badge,
                                                            color: grade.badgeText,
                                                        }}
                                                    >
                                                        {grade.label}
                                                    </span>
                                                    <span className={`text-xs font-semibold ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                                                        🔥{streak}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                );
            })()}

            {/* 마일스톤 체크박스 (STATE 타입만) */}
            {selectedWig.measureType === 'STATE' && localMilestones && localMilestones.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <Award className="mr-2 text-yellow-500" size={24} />
                        마일스톤 진행상황
                    </h3>
                    <div className="space-y-3">
                        {localMilestones
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((milestone, idx) => (
                                <div key={milestone.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={milestone.completed}
                                        onChange={() => handleMilestoneToggle(milestone.id)}
                                        className="w-5 h-5 text-green-600 rounded cursor-pointer"
                                    />
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                        milestone.completed
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {milestone.orderIndex || idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-lg ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                            {milestone.name}
                                        </div>
                                    </div>
                                    {milestone.completed && (
                                        <span className="text-green-600 font-semibold">✓</span>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;