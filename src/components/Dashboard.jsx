import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, CheckSquare, Award, Activity, Flame, XCircle } from 'lucide-react';
import commitmentApi from '../api/commitmentApi';
import weeklyDataApi from '../api/weeklyDataApi';
import dailyDataApi from '../api/dailyDataApi';
import milestoneApi from '../api/milestoneApi';
import { getLocalToday, getCurrentWeek } from '../utils/weekUtils';

const Dashboard = ({ wigs, selectedWigId, onSelectWig, refreshKey }) => {
    const [commitments, setCommitments] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [todayDailyData, setTodayDailyData] = useState(null);
    const [allDailyData, setAllDailyData] = useState([]);
    const [localMilestones, setLocalMilestones] = useState([]);

    const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];
    const currentWeek = getCurrentWeek(selectedWig);

    useEffect(() => {
        if (selectedWig?.milestones) {
            setLocalMilestones(selectedWig.milestones);
        } else {
            setLocalMilestones([]);
        }
    }, [selectedWig?.id, selectedWig?.milestones]);

    useEffect(() => {
        if (!selectedWigId) return;
        loadData();
    }, [selectedWigId, refreshKey, currentWeek]);

    const loadData = async () => {
        try {
            const [commitmentsData, weeklyDataResult, allDailyDataResult] = await Promise.all([
                commitmentApi.getByWigIdAndWeek(selectedWigId, currentWeek),
                weeklyDataApi.getByWigId(selectedWigId),
                dailyDataApi.getByWigId(selectedWigId)
            ]);

            setCommitments(commitmentsData || []);
            setWeeklyData(weeklyDataResult || []);
            setAllDailyData(allDailyDataResult || []);

            const today = getLocalToday();
            const todayRecord = (allDailyDataResult || []).find(item => item.date === today) || null;
            setTodayDailyData(todayRecord);
        } catch (err) {
            console.error('Dashboard load failed:', err);
            setCommitments([]);
            setWeeklyData([]);
            setAllDailyData([]);
            setTodayDailyData(null);
        }
    };

    const getLagProgress = () => {
        if (!selectedWig) return 0;

        if (selectedWig.measureType === 'STATE') {
            if (!localMilestones.length) return 0;
            const completed = localMilestones.filter(m => m.completed).length;
            return ((completed / localMilestones.length) * 100).toFixed(1);
        }

        const latest = weeklyData.length > 0
            ? [...weeklyData].sort((a, b) => b.week.localeCompare(a.week))[0]
            : null;

        if (!latest || latest.actual === null || latest.actual === undefined) return 0;

        const from = Number(selectedWig.fromX) || 0;
        const to = Number(selectedWig.toY) || 0;
        const current = Number(latest.actual) || 0;

        if (from === to) return 100;
        if (from > to) {
            return Math.min(100, Math.max(0, ((from - current) / (from - to)) * 100)).toFixed(1);
        }

        return Math.min(100, Math.max(0, ((current - from) / (to - from)) * 100)).toFixed(1);
    };

    const getCurrentLagValue = () => {
        if (!selectedWig) return '-';

        if (selectedWig.measureType === 'STATE') {
            const completed = localMilestones.filter(m => m.completed).length;
            return `${completed}/${localMilestones.length} done`;
        }

        const latest = weeklyData.length > 0
            ? [...weeklyData].sort((a, b) => b.week.localeCompare(a.week))[0]
            : null;

        if (latest?.actual !== null && latest?.actual !== undefined) {
            return `${latest.actual} ${selectedWig.unit || ''}`.trim();
        }

        return `${selectedWig.fromX} ${selectedWig.unit || ''}`.trim();
    };

    const handleMilestoneToggle = async (milestoneId) => {
        try {
            const result = await milestoneApi.toggleCompleted(milestoneId);
            setLocalMilestones(prev =>
                prev.map(m => (m.id === milestoneId ? { ...m, completed: result.completed } : m))
            );
        } catch (err) {
            console.error('Milestone toggle failed:', err);
            alert('Failed to update milestone state.');
        }
    };

    const isLeadAchieved = (lead, actualValue) => {
        const target = Number(lead.dailyTarget);
        if (Number.isNaN(target)) return false;

        const actual = Number(actualValue || 0);
        return lead.goalDirection === 'MINIMIZE'
            ? actual <= target
            : actual >= target;
    };

    const getLeadStreak = (leadKey, lead) => {
        if (!allDailyData.length) return 0;

        const dataByDate = new Map(
            allDailyData.map(item => [item.date, Number(item[leadKey] || 0)])
        );

        let streak = 0;
        const cursor = new Date(getLocalToday());

        while (true) {
            const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
            if (!dataByDate.has(dateKey) || !isLeadAchieved(lead, dataByDate.get(dateKey))) {
                break;
            }

            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    };

    const lagProgress = getLagProgress();
    const completedCommitments = commitments.filter(c => c.completed).length;
    const totalCommitments = commitments.length;
    const enrichedLeads = (selectedWig?.leadMeasures || []).map((lead, idx) => {
        const leadKey = `lead${idx + 1}`;
        const dailyActual = Number(todayDailyData?.[leadKey] || 0);
        const streak = getLeadStreak(leadKey, lead);

        return {
            ...lead,
            leadKey,
            dailyActual,
            streak,
            achievedToday: isLeadAchieved(lead, dailyActual)
        };
    });
    const achievedLeadCount = enrichedLeads.filter(lead => lead.achievedToday).length;
    const bestLeadStreak = enrichedLeads.reduce((max, lead) => Math.max(max, lead.streak), 0);

    if (!selectedWig) return null;

    const maximizeLeads = enrichedLeads.filter(lead => lead.goalDirection !== 'MINIMIZE');
    const minimizeLeads = enrichedLeads.filter(lead => lead.goalDirection === 'MINIMIZE');

    return (
        <div className="space-y-6">
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

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{selectedWig.title}</h2>
                        <div className="flex items-center space-x-3 text-lg">
                            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full">
                                {selectedWig.fromX}
                            </span>
                            <span>to</span>
                            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full">
                                {selectedWig.toY}
                            </span>
                        </div>
                        <p className="mt-2 text-sm opacity-90">Target date {selectedWig.byWhen}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedWig.measureType === 'NUMERIC' ? 'bg-green-400' : 'bg-yellow-400'
                    } text-gray-900`}>
                        {selectedWig.measureType === 'NUMERIC' ? 'NUMERIC' : 'STATE'}
                    </span>
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-semibold">Current: {getCurrentLagValue()}</span>
                        <span className="text-lg font-bold">{lagProgress}%</span>
                    </div>
                    <div className="w-full bg-white bg-opacity-30 rounded-full h-4">
                        <div
                            className="bg-white rounded-full h-4 transition-all duration-500"
                            style={{ width: `${Math.min(100, Number(lagProgress))}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Lag progress</p>
                            <p className="text-2xl font-bold text-gray-800">{lagProgress}%</p>
                        </div>
                        <TrendingUp className="text-blue-500" size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Current week</p>
                            <p className="text-2xl font-bold text-gray-800">{currentWeek}</p>
                        </div>
                        <Target className="text-green-500" size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Commitments ({currentWeek})</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {completedCommitments}/{totalCommitments}
                            </p>
                        </div>
                        <CheckSquare className="text-purple-500" size={32} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Lead streak</p>
                            <p className="text-2xl font-bold text-gray-800">{bestLeadStreak}d</p>
                            <p className="text-xs text-gray-500 mt-1">Today hit {achievedLeadCount}/{enrichedLeads.length}</p>
                        </div>
                        <Flame className="text-orange-500" size={32} />
                    </div>
                </div>
            </div>

            {maximizeLeads.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity className="text-blue-500" size={18} />
                        Lead Measures (maximize) - today
                    </h3>
                    <div className="space-y-3">
                        {maximizeLeads.map((lead) => {
                            const barProgress = lead.dailyTarget
                                ? ((lead.dailyActual || 0) / lead.dailyTarget) * 100
                                : 0;
                            const isGood = barProgress >= 100;

                            return (
                                <div key={lead.id} className="flex items-center gap-4">
                                    <div className="w-36 flex-shrink-0">
                                        <span className="font-medium text-gray-700">{lead.name}</span>
                                        <span className="text-xs ml-1 text-green-500">up</span>
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
                                        <span className={`text-sm ${isGood ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                            {lead.dailyActual || 0} {lead.unit}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">
                                            ({barProgress.toFixed(0)}%)
                                        </span>
                                        <div className={`text-xs mt-1 ${lead.achievedToday ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                                            Streak {lead.streak}d
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {minimizeLeads.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity className="text-orange-500" size={18} />
                        Lead Measures (minimize) - today
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {minimizeLeads.map((lead) => {
                            const target = lead.dailyTarget || 1;
                            const ratio = lead.dailyActual / target;
                            const isOver = ratio > 1;
                            const isNearLimit = !isOver && ratio >= 0.9;

                            const grade = isOver
                                ? {
                                    label: 'Over',
                                    bg: '#FCEBEB',
                                    text: '#501313',
                                    sub: '#A32D2D',
                                    badge: '#F7C1C1',
                                    badgeText: '#791F1F',
                                    border: '#E24B4A',
                                }
                                : isNearLimit
                                    ? {
                                        label: 'Warn',
                                        bg: '#EAF3DE',
                                        text: '#173404',
                                        sub: '#3B6D11',
                                        badge: '#FAC775',
                                        badgeText: '#633806',
                                        border: '#EF9F27',
                                    }
                                    : {
                                        label: 'Safe',
                                        bg: '#EAF3DE',
                                        text: '#173404',
                                        sub: '#3B6D11',
                                        badge: '#C0DD97',
                                        badgeText: '#27500A',
                                        border: 'transparent',
                                    };

                            return (
                                <div
                                    key={lead.id}
                                    className="rounded-xl p-4 text-center relative transition-all duration-500"
                                    style={{
                                        backgroundColor: grade.bg,
                                        border: grade.border !== 'transparent' ? `2px solid ${grade.border}` : '2px solid transparent',
                                    }}
                                >
                                    {isNearLimit && (
                                        <div
                                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                                            style={{ backgroundColor: '#EF9F27' }}
                                        >
                                            <span className="text-white text-sm font-bold leading-none">!</span>
                                        </div>
                                    )}

                                    {isOver && (
                                        <div
                                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                                            style={{ backgroundColor: '#E24B4A' }}
                                        >
                                            <XCircle size={16} className="text-white" />
                                        </div>
                                    )}

                                    <p
                                        className="text-xs font-medium mb-1 truncate"
                                        style={{ color: grade.sub }}
                                        title={lead.name}
                                    >
                                        {lead.name}
                                    </p>
                                    <p
                                        className="text-2xl font-bold leading-tight"
                                        style={{ color: grade.text }}
                                    >
                                        {lead.dailyActual || 0}
                                    </p>
                                    <p
                                        className="text-xs mt-1"
                                        style={{ color: grade.sub }}
                                    >
                                        / {target} {lead.unit}
                                    </p>
                                    <div className="mt-2 inline-block">
                                        <span
                                            className="text-xs font-semibold px-3 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: grade.badge,
                                                color: grade.badgeText,
                                            }}
                                        >
                                            {grade.label}
                                        </span>
                                    </div>
                                    <p
                                        className="text-xs mt-2 font-semibold"
                                        style={{ color: lead.achievedToday ? '#C2410C' : grade.sub }}
                                    >
                                        Streak {lead.streak}d
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedWig.measureType === 'STATE' && localMilestones.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <Award className="mr-2 text-yellow-500" size={24} />
                        Milestones
                    </h3>
                    <div className="space-y-3">
                        {[...localMilestones]
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
                                        <span className="text-green-600 font-semibold">Done</span>
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
