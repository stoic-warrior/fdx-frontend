import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckSquare, Award, Activity } from 'lucide-react';
import commitmentApi from '../api/commitmentApi';
import weeklyDataApi from '../api/weeklyDataApi';
import dailyDataApi from '../api/dailyDataApi';
import milestoneApi from '../api/milestoneApi';

const Dashboard = ({ wigs, selectedWigId, onSelectWig, onWigChange, refreshKey }) => {
    const [commitments, setCommitments] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [todayDailyData, setTodayDailyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [localMilestones, setLocalMilestones] = useState([]);

    const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];

    // 로컬 시간 기준 오늘 날짜
    const getLocalToday = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    // 선택된 WIG 바뀌면 로컬 마일스톤 동기화
    useEffect(() => {
        if (selectedWig?.milestones) {
            setLocalMilestones(selectedWig.milestones);
        }
    }, [selectedWig?.id, selectedWig?.milestones]);
    const currentWeek = 'W5'; // 실제로는 현재 주차 계산 필요

    useEffect(() => {
        if (selectedWigId) {
            loadData();
        }
    }, [selectedWigId, refreshKey]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [commitmentsData, weeklyDataResult] = await Promise.all([
                commitmentApi.getByWigIdAndWeek(selectedWigId, currentWeek),
                weeklyDataApi.getByWigId(selectedWigId)
            ]);
            setCommitments(commitmentsData);
            setWeeklyData(weeklyDataResult);

            // 모든 주차에서 오늘 날짜의 일간 데이터 찾기
            try {
                const today = getLocalToday();
                const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

                let foundTodayData = null;
                for (const week of weeks) {
                    const dailyResult = await dailyDataApi.getByWigIdAndWeek(selectedWigId, week);
                    if (dailyResult && dailyResult.length > 0) {
                        const todayData = dailyResult.find(d => d.date === today);
                        if (todayData) {
                            foundTodayData = todayData;
                            break;
                        }
                    }
                }
                setTodayDailyData(foundTodayData);
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

    // Lag 진행률 계산
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

    // 현재 Lag 값
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

    // 마일스톤 토글 (로컬 상태만 업데이트, 스크롤 유지)
    const handleMilestoneToggle = async (milestoneId) => {
        try {
            const result = await milestoneApi.toggleCompleted(milestoneId);

            // 로컬 상태만 업데이트 (전체 리로드 안 함)
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

            {/* WIG 헤더 (이게 Lag Measure) */}
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
                    <div className="flex justify-between text-sm mb-1">
                        <span>진행률</span>
                        <span>{lagProgress}%</span>
                    </div>
                    <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                        <div
                            className="bg-white h-3 rounded-full transition-all duration-500"
                            style={{ width: `${lagProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">현재 상태</p>
                            <p className="text-2xl font-bold text-gray-800">{getCurrentLagValue()}</p>
                        </div>
                        <Target className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">진행률</p>
                            <p className="text-2xl font-bold text-gray-800">{lagProgress}%</p>
                        </div>
                        <TrendingUp className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">이번 주 약속</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {completedCommitments}/{totalCommitments}
                            </p>
                        </div>
                        <CheckSquare className="text-purple-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Lead Measures - 일간 기준, 길고 얇은 형태 */}
            {selectedWig.leadMeasures && selectedWig.leadMeasures.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity className="text-blue-500" size={18} />
                        Lead Measures (선행지표) - 오늘
                    </h3>
                    <div className="space-y-3">
                        {selectedWig.leadMeasures.map((lead, idx) => {
                            // 오늘 일간 데이터에서 실적 가져오기
                            const dailyActual = todayDailyData
                                ? (idx === 0 ? todayDailyData.lead1 : todayDailyData.lead2)
                                : 0;
                            const dailyProgress = lead.dailyTarget
                                ? ((dailyActual || 0) / lead.dailyTarget * 100).toFixed(0)
                                : 0;

                            return (
                                <div key={lead.id} className="flex items-center gap-4">
                                    <div className="w-32 flex-shrink-0">
                                        <span className="font-medium text-gray-700">{lead.name}</span>
                                        <span className="text-gray-400 text-xs ml-1">
                                            (일 {lead.dailyTarget}{lead.unit})
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                    dailyProgress >= 100 ? 'bg-green-500' :
                                                        dailyProgress >= 70 ? 'bg-blue-500' : 'bg-yellow-500'
                                                }`}
                                                style={{ width: `${Math.min(100, dailyProgress)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-24 text-right flex-shrink-0">
                                        <span className="text-sm text-gray-600">
                                            {dailyActual || 0} {lead.unit}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">
                                            ({dailyProgress}%)
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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