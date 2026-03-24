import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';
import dailyDataApi from '../api/dailyDataApi';
import weeklyDataApi from '../api/weeklyDataApi';

/**
 * Scoreboard
 * - 일간 데이터만 입력/수정/삭제
 * - 주간 데이터는 일간 합산으로 자동 계산 (조회만)
 * - 차트에 주간/일간 토글 버튼 있음
 */
const Scoreboard = ({ wigs, selectedWigId, onSelectWig, onTodayDataChange }) => {
    const [dailyData, setDailyData] = useState({});
    const [loading, setLoading] = useState(false);

    // localStorage에서 차트 설정 불러오기
    const [chartTypes, setChartTypes] = useState(() => {
        const saved = localStorage.getItem('scoreboard_chartTypes');
        return saved ? JSON.parse(saved) : { lag: 'line', lead1: 'line', lead2: 'line', lead3: 'line', lead4: 'line', lead5: 'line' };
    });
    const [chartTimeViews, setChartTimeViews] = useState(() => {
        const saved = localStorage.getItem('scoreboard_chartTimeViews');
        return saved ? JSON.parse(saved) : { lag: 'weekly', lead1: 'weekly', lead2: 'weekly', lead3: 'weekly', lead4: 'weekly', lead5: 'weekly' };
    });
    const [selectedWeek, setSelectedWeek] = useState(() => {
        return localStorage.getItem('scoreboard_selectedWeek') || 'W1';
    });

    // 차트 설정 변경 시 localStorage에 저장
    useEffect(() => {
        localStorage.setItem('scoreboard_chartTypes', JSON.stringify(chartTypes));
    }, [chartTypes]);

    useEffect(() => {
        localStorage.setItem('scoreboard_chartTimeViews', JSON.stringify(chartTimeViews));
    }, [chartTimeViews]);

    useEffect(() => {
        localStorage.setItem('scoreboard_selectedWeek', selectedWeek);
    }, [selectedWeek]);

    // WIG 변경 시 현재 주차로 설정 (localStorage에 저장된 값이 유효하지 않으면)
    useEffect(() => {
        if (selectedWig && weeks.length > 0) {
            const savedWeek = localStorage.getItem('scoreboard_selectedWeek');
            if (!savedWeek || !weeks.includes(savedWeek)) {
                const currentWeek = getCurrentWeek();
                setSelectedWeek(currentWeek);
            }
        }
    }, [selectedWigId]);

    // 편집 상태
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // 신규 입력 상태 (인라인 - 날짜 기준)
    const [creatingDate, setCreatingDate] = useState(null);
    const getLocalToday = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };
    const [newData, setNewData] = useState({
        date: '',
        dayOfWeek: '',
        lead1: '',
        lead2: '',
        lead3: '',
        lead4: '',
        lead5: ''
    });

    // 오늘 데이터가 이미 있는지 체크
    const todayData = (() => {
        const today = getLocalToday();
        const allDailyData = Object.values(dailyData).flat();
        return allDailyData.find(d => d.date === today);
    })();

    const [weeklyActual, setWeeklyActual] = useState({});
    const [editingWeeklyActual, setEditingWeeklyActual] = useState(null);
    const [newWeeklyActual, setNewWeeklyActual] = useState('');

    const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];

    // WIG 생성일 (min 날짜로 사용)
    const wigCreatedDate = selectedWig?.createdAt?.split('T')[0] || '2020-01-01';

    // WIG 기간에 따른 동적 주차 계산
    const calculateWeeks = () => {
        if (!selectedWig) return ['W1'];

        const startDate = new Date(wigCreatedDate);
        const endDate = selectedWig.byWhen ? new Date(selectedWig.byWhen) : new Date();
        const today = new Date(getLocalToday());

        // 목표일과 오늘 중 더 늦은 날짜까지 주차 생성
        const finalDate = new Date(Math.max(endDate, today));

        const diffTime = finalDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.max(1, Math.ceil(diffDays / 7));

        return Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);
    };

    const weeks = calculateWeeks();

    // 현재 주차 계산 (오늘 기준)
    const getCurrentWeek = () => {
        const startDate = new Date(wigCreatedDate);
        const today = new Date(getLocalToday());
        const diffTime = today - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentWeekNum = Math.max(1, Math.ceil(diffDays / 7));
        const currentWeek = `W${currentWeekNum}`;

        // weeks 범위 내에 있는지 확인
        return weeks.includes(currentWeek) ? currentWeek : weeks[weeks.length - 1];
    };

    // 빈 날짜를 채워서 반환 (WIG 생성일 ~ 오늘)
    // MAXIMIZE 지표: 빈 날 → 0, MINIMIZE 지표: 빈 날 → null (connectNulls로 연결)
    const fillMissingDates = (weekData, week, leadMeasures = []) => {
        const today = getLocalToday();
        const startDate = new Date(Math.max(new Date(wigCreatedDate), getWeekStartDate(week)));
        const endDate = new Date(Math.min(new Date(today), getWeekEndDate(week)));

        const filledData = [];
        const existingDates = new Set(weekData.map(d => d.date));

        const defaultVal = (idx) =>
            leadMeasures[idx]?.goalDirection === 'MINIMIZE' ? null : 0;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (existingDates.has(dateStr)) {
                const item = weekData.find(item => item.date === dateStr);
                filledData.push({
                    ...item,
                    lead1: item.lead1 ?? defaultVal(0),
                    lead2: item.lead2 ?? defaultVal(1),
                    lead3: item.lead3 ?? defaultVal(2),
                    lead4: item.lead4 ?? defaultVal(3),
                    lead5: item.lead5 ?? defaultVal(4),
                });
            } else {
                filledData.push({
                    id: `empty-${dateStr}`,
                    date: dateStr,
                    dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
                    lead1: defaultVal(0),
                    lead2: defaultVal(1),
                    lead3: defaultVal(2),
                    lead4: defaultVal(3),
                    lead5: defaultVal(4),
                    isEmpty: true
                });
            }
        }
        return filledData.sort((a, b) => a.date.localeCompare(b.date));
    };

    // 주차 시작일/종료일 (간단히 7일 단위로 계산)
    const getWeekStartDate = (week) => {
        const weekNum = parseInt(week.replace('W', ''));
        const start = new Date(wigCreatedDate);
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        return start;
    };

    const getWeekEndDate = (week) => {
        const start = getWeekStartDate(week);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return end;
    };

    useEffect(() => {
        if (selectedWigId) {
            loadData();
        }
    }, [selectedWigId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 일간 데이터 로드
            const dailyPromises = weeks.map(async (week) => {
                try {
                    const data = await dailyDataApi.getByWigIdAndWeek(selectedWigId, week);
                    return [week, data];
                } catch {
                    return [week, []];
                }
            });

            const dailyResults = await Promise.all(dailyPromises);
            setDailyData(Object.fromEntries(dailyResults));

            // 주간 데이터 로드 (actual 값)
            try {
                const weeklyResult = await weeklyDataApi.getByWigId(selectedWigId);
                const weeklyMap = {};
                weeklyResult.forEach(w => {
                    weeklyMap[w.week] = w;
                });
                setWeeklyActual(weeklyMap);
            } catch {
                setWeeklyActual({});
            }
        } catch (err) {
            console.error('데이터 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    // 일간 데이터에서 주간 데이터 계산 (lead 합산, actual은 주간 데이터에서)
    const calculateWeeklyData = () => {
        return weeks.map(week => {
            const weekDailyData = dailyData[week] || [];
            const weeklyData = weeklyActual[week];

            // lead는 일간 합산 (MINIMIZE 지표는 데이터 없는 주 → null로 처리)
            const leadSums = {};
            const leadMeasures = selectedWig?.leadMeasures || [];
            for (let i = 1; i <= 5; i++) {
                const isMinimize = leadMeasures[i - 1]?.goalDirection === 'MINIMIZE';
                const hasData = weekDailyData.some(d => d[`lead${i}`] != null);
                leadSums[`lead${i}`] = (!hasData && isMinimize)
                    ? null
                    : weekDailyData.reduce((sum, d) => sum + (d[`lead${i}`] || 0), 0);
            }

            // actual은 주간 데이터에서 직접 가져옴
            // MINIMIZE lag(toY < fromX)는 데이터 없는 주 → null (connectNulls로 연결)
            const lagIsMinimize = parseFloat(selectedWig?.toY) < parseFloat(selectedWig?.fromX);
            const actual = weeklyData?.actual ?? (lagIsMinimize ? null : 0);

            return {
                week,
                actual,
                ...leadSums,
                weeklyDataId: weeklyData?.id
            };
        }).filter(d => weeks.indexOf(d.week) <= weeks.indexOf(getCurrentWeek()));
    };

    const weeklyChartData = calculateWeeklyData();

    const toggleChartType = (chartId) => {
        setChartTypes(prev => ({
            ...prev,
            [chartId]: prev[chartId] === 'line' ? 'bar' : 'line'
        }));
    };

    const toggleChartTimeView = (chartId) => {
        setChartTimeViews(prev => ({
            ...prev,
            [chartId]: prev[chartId] === 'weekly' ? 'daily' : 'weekly'
        }));
    };

    // 신규 데이터 저장 (일간만)
    const handleCreate = async () => {
        try {
            const today = getLocalToday();

            // 미래 날짜 체크
            if (newData.date > today) {
                alert('미래 날짜는 입력할 수 없습니다.');
                return;
            }

            // 이미 해당 날짜 데이터가 있는지 체크
            const allDailyData = Object.values(dailyData).flat();
            const existingData = allDailyData.find(d => d.date === newData.date);
            if (existingData) {
                alert('해당 날짜의 데이터가 이미 있습니다. 수정해주세요.');
                return;
            }

            const response = await dailyDataApi.create({
                date: newData.date,
                week: selectedWeek,
                dayOfWeek: newData.dayOfWeek,
                lead1: newData.lead1 ? parseFloat(newData.lead1) : null,
                lead2: newData.lead2 ? parseFloat(newData.lead2) : null,
                lead3: newData.lead3 ? parseFloat(newData.lead3) : null,
                lead4: newData.lead4 ? parseFloat(newData.lead4) : null,
                lead5: newData.lead5 ? parseFloat(newData.lead5) : null,
                wigId: selectedWigId
            });

            // 로컬 state 업데이트 (리로드 없이)
            setDailyData(prev => ({
                ...prev,
                [selectedWeek]: [...(prev[selectedWeek] || []), response].sort((a, b) => a.date.localeCompare(b.date))
            }));

            const inputDate = newData.date;
            setCreatingDate(null);
            setNewData({ date: '', dayOfWeek: '', lead1: '', lead2: '', lead3: '', lead4: '', lead5: '' });

            // 오늘 데이터 변경 시 Dashboard에 알림
            if (inputDate === today && onTodayDataChange) {
                onTodayDataChange();
            }
        } catch (err) {
            console.error('저장 실패:', err);
            alert(err.message || '저장에 실패했습니다.');
        }
    };

    // 데이터 수정 (일간만)
    const handleUpdate = async (id) => {
        try {
            const today = getLocalToday();

            // 미래 날짜 체크
            if (editData.date > today) {
                alert('미래 날짜는 입력할 수 없습니다.');
                return;
            }

            const response = await dailyDataApi.update(id, {
                date: editData.date,
                week: editData.week,
                dayOfWeek: editData.dayOfWeek,
                lead1: editData.lead1 ? parseFloat(editData.lead1) : null,
                lead2: editData.lead2 ? parseFloat(editData.lead2) : null,
                lead3: editData.lead3 ? parseFloat(editData.lead3) : null,
                lead4: editData.lead4 ? parseFloat(editData.lead4) : null,
                lead5: editData.lead5 ? parseFloat(editData.lead5) : null,
                wigId: selectedWigId
            });

            // 로컬 state 업데이트 (리로드 없이)
            setDailyData(prev => ({
                ...prev,
                [selectedWeek]: (prev[selectedWeek] || []).map(item =>
                    item.id === id ? response : item
                )
            }));

            setEditingId(null);

            // 오늘 데이터 변경 시 Dashboard에 알림
            if (editData.date === today && onTodayDataChange) {
                onTodayDataChange();
            }
        } catch (err) {
            console.error('수정 실패:', err);
            alert(err.message || '수정에 실패했습니다.');
        }
    };

    // 데이터 삭제 (일간만)
    const handleDelete = async (id, itemDate) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const today = getLocalToday();

            await dailyDataApi.delete(id);

            // 로컬 state 업데이트 (리로드 없이)
            setDailyData(prev => ({
                ...prev,
                [selectedWeek]: (prev[selectedWeek] || []).filter(item => item.id !== id)
            }));

            // 오늘 데이터 삭제 시 Dashboard에 알림
            if (itemDate === today && onTodayDataChange) {
                onTodayDataChange();
            }
        } catch (err) {
            console.error('삭제 실패:', err);
            alert('삭제에 실패했습니다.');
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditData({ ...item });
    };

    if (loading) {
        return <div className="text-center py-12">로딩 중...</div>;
    }

    if (!selectedWig) return null;

    const currentDailyData = fillMissingDates(dailyData[selectedWeek] || [], selectedWeek, selectedWig.leadMeasures || []);

    return (
        <div className="space-y-6">
            {/* WIG 선택 + 주차 선택 */}
            <div className="flex items-center justify-between flex-wrap gap-4">
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

                {/* 주차 선택 드롭다운 */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-600">주차:</label>
                    <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {weeks.map(week => (
                            <option key={week} value={week}>{week}</option>
                        ))}
                    </select>
                    <span className="text-xs text-gray-500">
                        (현재: {getCurrentWeek()})
                    </span>
                </div>
            </div>

            {/* 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lag Measure 차트 (NUMERIC만) */}
                {selectedWig.measureType === 'NUMERIC' && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Lag: {selectedWig.title} ({selectedWig.unit})</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleChartType('lag')}
                                    className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    title="차트 타입 변경"
                                >
                                    {chartTypes.lag === 'line' ? <BarChart3 size={16} /> : <LineChartIcon size={16} />}
                                </button>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            {chartTypes.lag === 'line' ? (
                                <LineChart data={weeklyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis domain={[0, dataMax => Math.max(dataMax, parseFloat(selectedWig.toY) * 1.1)]} />
                                    <Tooltip />
                                    <ReferenceLine y={parseFloat(selectedWig.toY)} stroke="#ef4444" strokeDasharray="5 5" label="목표" />
                                    <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} name="실제" connectNulls={parseFloat(selectedWig.toY) < parseFloat(selectedWig.fromX)} />
                                </LineChart>
                            ) : (
                                <BarChart data={weeklyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis domain={[0, dataMax => Math.max(dataMax, parseFloat(selectedWig.toY) * 1.1)]} />
                                    <Tooltip />
                                    <ReferenceLine y={parseFloat(selectedWig.toY)} stroke="#ef4444" strokeDasharray="5 5" />
                                    <Bar dataKey="actual" fill="#3b82f6" name="실제" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                        <div className="mt-2 text-sm text-gray-600 text-center">
                            목표: {selectedWig.toY} {selectedWig.unit}
                        </div>
                    </div>
                )}

                {/* Lead Measure 차트들 */}
                {selectedWig.leadMeasures?.map((lead, idx) => {
                    const chartKey = `lead${idx + 1}`;
                    const timeView = chartTimeViews[chartKey] || 'weekly';
                    const dataToShow = timeView === 'weekly' ? weeklyChartData : fillMissingDates(dailyData[selectedWeek] || [], selectedWeek, selectedWig.leadMeasures || []);
                    const xKey = timeView === 'weekly' ? 'week' : 'dayOfWeek';
                    const targetValue = timeView === 'weekly' ? lead.weeklyTarget : lead.dailyTarget;

                    return (
                        <div key={lead.id} className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Lead: {lead.name} ({lead.unit})</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleChartType(chartKey)}
                                        className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200"
                                        title="차트 타입 변경"
                                    >
                                        {chartTypes[chartKey] === 'line' ? <BarChart3 size={16} /> : <LineChartIcon size={16} />}
                                    </button>
                                    <div className="flex bg-gray-200 rounded-lg p-0.5">
                                        <button
                                            onClick={() => toggleChartTimeView(chartKey)}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                timeView === 'daily' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            일간
                                        </button>
                                        <button
                                            onClick={() => toggleChartTimeView(chartKey)}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                timeView === 'weekly' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            주간
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <ResponsiveContainer width="100%" height={200}>
                                {chartTypes[chartKey] === 'line' ? (
                                    <LineChart data={dataToShow}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={xKey} />
                                        <YAxis domain={[0, dataMax => Math.max(dataMax, parseFloat(targetValue || 0) * 1.1)]} />
                                        <Tooltip />
                                        <ReferenceLine y={targetValue} stroke="#ef4444" strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey={chartKey} stroke={["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"][idx]} strokeWidth={3} name={lead.name} connectNulls={lead.goalDirection === 'MINIMIZE'} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={dataToShow}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={xKey} />
                                        <YAxis domain={[0, dataMax => Math.max(dataMax, parseFloat(targetValue || 0) * 1.1)]} />
                                        <Tooltip />
                                        <ReferenceLine y={targetValue} stroke="#ef4444" strokeDasharray="5 5" />
                                        <Bar dataKey={chartKey} fill={["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"][idx]} name={lead.name} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                            <div className="mt-2 text-sm text-gray-600 text-center">
                                {timeView === 'weekly' ? '주간' : '일간'} 목표: {targetValue} {lead.unit}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 데이터 테이블 영역 */}
            <div className="bg-white rounded-lg shadow">
                {/* 테이블 헤더 */}
                <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
                    <h3 className="font-bold text-lg">{selectedWeek} 일간 데이터 입력</h3>

                    {/* 오늘 데이터 상태 */}
                    <span className={`px-3 py-1 rounded-full text-sm ${
                        todayData
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {todayData ? '✓ 오늘 입력 완료' : '⚠ 오늘 미입력'}
                    </span>
                </div>

                {/* 주간 합산 요약 + Actual 입력 (NUMERIC 타입만) */}
                <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="text-sm text-gray-600">
                            <strong>{selectedWeek} 주간 합산:</strong>
                            {(() => {
                                const weekSummary = weeklyChartData.find(w => w.week === selectedWeek);
                                return (
                                    <span className="ml-2">
                                        {selectedWig.leadMeasures?.map((lead, idx) => (
                                            <span key={lead.id} className="mr-4">{lead.name}: {weekSummary?.[`lead${idx + 1}`] || 0} {lead.unit}</span>
                                        ))}
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Actual 입력 (NUMERIC 타입만) */}
                        {selectedWig.measureType === 'NUMERIC' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {selectedWeek} 실제값 ({selectedWig.unit}):
                                </span>
                                {editingWeeklyActual === selectedWeek ? (
                                    <>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newWeeklyActual}
                                            onChange={e => setNewWeeklyActual(e.target.value)}
                                            className="p-1 border rounded w-24"
                                            placeholder="측정값"
                                        />
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const existing = weeklyActual[selectedWeek];
                                                    if (existing?.id) {
                                                        await weeklyDataApi.update(existing.id, {
                                                            week: selectedWeek,
                                                            actual: parseFloat(newWeeklyActual) || null,
                                                            wigId: selectedWigId
                                                        });
                                                    } else {
                                                        await weeklyDataApi.create({
                                                            week: selectedWeek,
                                                            actual: parseFloat(newWeeklyActual) || null,
                                                            wigId: selectedWigId
                                                        });
                                                    }
                                                    setEditingWeeklyActual(null);
                                                    setNewWeeklyActual('');
                                                    loadData();
                                                } catch (err) {
                                                    console.error('저장 실패:', err);
                                                    alert(err.message || '저장에 실패했습니다.');
                                                }
                                            }}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingWeeklyActual(null);
                                                setNewWeeklyActual('');
                                            }}
                                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-bold text-blue-600">
                                            {weeklyActual[selectedWeek]?.actual ?? '-'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setEditingWeeklyActual(selectedWeek);
                                                setNewWeeklyActual(weeklyActual[selectedWeek]?.actual || '');
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 일간 데이터 테이블 */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">날짜</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">요일</th>
                            {selectedWig.leadMeasures?.map(lead => (
                                <th key={lead.id} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    {lead.name} ({lead.unit})
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">액션</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {currentDailyData.map(item => (
                            <tr key={item.id} className={`hover:bg-gray-50 ${item.isEmpty ? 'bg-gray-50 text-gray-400' : ''}`}>
                                {editingId === item.id && !item.isEmpty ? (
                                    // 편집 모드
                                    <>
                                        <td className="px-4 py-3">
                                            <input
                                                type="date"
                                                value={editData.date}
                                                min={wigCreatedDate}
                                                max={getLocalToday()}
                                                onChange={e => {
                                                    const date = new Date(e.target.value);
                                                    setEditData({
                                                        ...editData,
                                                        date: e.target.value,
                                                        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
                                                    });
                                                }}
                                                className="p-1 border rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3">{editData.dayOfWeek}</td>
                                        {selectedWig.leadMeasures?.map((lead, idx) => {
                                            const key = `lead${idx + 1}`;
                                            return (
                                                <td key={lead.id} className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={editData[key] || ''}
                                                        onChange={e => setEditData({...editData, [key]: e.target.value})}
                                                        className="p-1 border rounded w-20"
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleUpdate(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded mr-1">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </>
                                ) : creatingDate === item.date && item.isEmpty ? (
                                    // 입력 모드 (인라인)
                                    <>
                                        <td className="px-4 py-3">{item.date}</td>
                                        <td className="px-4 py-3">{item.dayOfWeek}</td>
                                        {selectedWig.leadMeasures?.map((lead, idx) => {
                                            const key = `lead${idx + 1}`;
                                            return (
                                                <td key={lead.id} className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={newData[key]}
                                                        onChange={e => setNewData({...newData, [key]: e.target.value})}
                                                        className="p-1 border rounded w-20"
                                                        placeholder={lead.dailyTarget}
                                                        autoFocus={idx === 0}
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={handleCreate} className="p-1 text-green-600 hover:bg-green-50 rounded mr-1">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => { setCreatingDate(null); setNewData({ date: '', dayOfWeek: '', lead1: '', lead2: '', lead3: '', lead4: '', lead5: '' }); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    // 보기 모드
                                    <>
                                        <td className="px-4 py-3">{item.date}</td>
                                        <td className="px-4 py-3">{item.dayOfWeek}</td>
                                        {selectedWig.leadMeasures?.map((lead, idx) => (
                                            <td key={lead.id} className="px-4 py-3">{item[`lead${idx + 1}`] ?? 0}</td>
                                        ))}
                                        <td className="px-4 py-3 text-center">
                                            {item.isEmpty ? (
                                                // 빈 데이터: 클릭하면 인라인 입력 모드
                                                <button
                                                    onClick={() => {
                                                        setCreatingDate(item.date);
                                                        setNewData({
                                                            date: item.date,
                                                            dayOfWeek: item.dayOfWeek,
                                                            lead1: '',
                                                            lead2: '',
                                                            lead3: '',
                                                            lead4: '',
                                                            lead5: ''
                                                        });
                                                    }}
                                                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    입력
                                                </button>
                                            ) : (
                                                // 실제 데이터: 수정/삭제
                                                <>
                                                    <button onClick={() => startEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id, item.date)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {currentDailyData.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                    {selectedWeek} 주차 데이터가 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Scoreboard;