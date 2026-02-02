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
    const [chartTypes, setChartTypes] = useState({ lag: 'line', lead1: 'line', lead2: 'line' });
    const [chartTimeViews, setChartTimeViews] = useState({ lag: 'weekly', lead1: 'weekly', lead2: 'weekly' });
    const [selectedChartWeek, setSelectedChartWeek] = useState({ lead1: 'W1', lead2: 'W1' });
    const [selectedWeek, setSelectedWeek] = useState('W1');

    // 편집 상태
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // 신규 입력 상태
    const [showNewForm, setShowNewForm] = useState(false);
    const getLocalToday = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };
    const [newData, setNewData] = useState({
        date: getLocalToday(),
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()],
        lead1: '',
        lead2: ''
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
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

    // WIG 생성일 (min 날짜로 사용)
    const wigCreatedDate = selectedWig?.createdAt?.split('T')[0] || '2020-01-01';

    // 빈 날짜를 0으로 채워서 반환 (WIG 생성일 ~ 오늘)
    const fillMissingDates = (weekData, week) => {
        const today = getLocalToday();
        const startDate = new Date(Math.max(new Date(wigCreatedDate), getWeekStartDate(week)));
        const endDate = new Date(Math.min(new Date(today), getWeekEndDate(week)));

        const filledData = [];
        const existingDates = new Set(weekData.map(d => d.date));

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (existingDates.has(dateStr)) {
                filledData.push(weekData.find(item => item.date === dateStr));
            } else {
                filledData.push({
                    id: `empty-${dateStr}`,
                    date: dateStr,
                    dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
                    lead1: 0,
                    lead2: 0,
                    isEmpty: true  // 빈 데이터 표시
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

            // lead는 일간 합산
            const lead1Sum = weekDailyData.reduce((sum, d) => sum + (d.lead1 || 0), 0);
            const lead2Sum = weekDailyData.reduce((sum, d) => sum + (d.lead2 || 0), 0);

            // actual은 주간 데이터에서 직접 가져옴
            const actual = weeklyData?.actual;

            if (!actual && lead1Sum === 0 && lead2Sum === 0) return null;

            return {
                week,
                actual,
                lead1: lead1Sum,
                lead2: lead2Sum,
                weeklyDataId: weeklyData?.id
            };
        }).filter(d => d !== null);
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

            await dailyDataApi.create({
                date: newData.date,
                week: selectedWeek,
                dayOfWeek: newData.dayOfWeek,
                lead1: newData.lead1 ? parseFloat(newData.lead1) : null,
                lead2: newData.lead2 ? parseFloat(newData.lead2) : null,
                wigId: selectedWigId
            });
            setShowNewForm(false);

            const inputDate = newData.date;

            setNewData({
                date: getLocalToday(),
                dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()],
                lead1: '',
                lead2: ''
            });
            loadData();

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

            await dailyDataApi.update(id, {
                date: editData.date,
                week: editData.week,
                dayOfWeek: editData.dayOfWeek,
                lead1: editData.lead1 ? parseFloat(editData.lead1) : null,
                lead2: editData.lead2 ? parseFloat(editData.lead2) : null,
                wigId: selectedWigId
            });
            setEditingId(null);
            loadData();

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
            loadData();

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

    const currentDailyData = fillMissingDates(dailyData[selectedWeek] || [], selectedWeek);

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
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip />
                                    <ReferenceLine y={parseFloat(selectedWig.toY)} stroke="#ef4444" strokeDasharray="5 5" label="목표" />
                                    <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} name="실제" />
                                </LineChart>
                            ) : (
                                <BarChart data={weeklyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis domain={['auto', 'auto']} />
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
                    const chartWeek = selectedChartWeek[chartKey] || 'W1';
                    const dataToShow = timeView === 'weekly' ? weeklyChartData : (dailyData[chartWeek] || []);
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

                            {/* 일간 뷰일 때 주차 선택 */}
                            {timeView === 'daily' && (
                                <div className="mb-3 flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-600">주 선택:</span>
                                    {weeks.slice(0, 6).map(week => (
                                        <button
                                            key={week}
                                            onClick={() => setSelectedChartWeek(prev => ({ ...prev, [chartKey]: week }))}
                                            className={`px-3 py-1 rounded text-xs font-medium ${
                                                chartWeek === week
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {week}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <ResponsiveContainer width="100%" height={200}>
                                {chartTypes[chartKey] === 'line' ? (
                                    <LineChart data={dataToShow}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={xKey} />
                                        <YAxis />
                                        <Tooltip />
                                        <ReferenceLine y={targetValue} stroke="#ef4444" strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey={chartKey} stroke={idx === 0 ? "#10b981" : "#f59e0b"} strokeWidth={3} name={lead.name} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={dataToShow}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={xKey} />
                                        <YAxis />
                                        <Tooltip />
                                        <ReferenceLine y={targetValue} stroke="#ef4444" strokeDasharray="5 5" />
                                        <Bar dataKey={chartKey} fill={idx === 0 ? "#10b981" : "#f59e0b"} name={lead.name} />
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
                    <div className="flex items-center gap-4 flex-wrap">
                        <h3 className="font-bold text-lg">일간 데이터 입력</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">주차:</span>
                            {weeks.slice(0, 6).map(week => (
                                <button
                                    key={week}
                                    onClick={() => setSelectedWeek(week)}
                                    className={`px-3 py-1 rounded text-sm ${
                                        selectedWeek === week
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {week}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 오늘 데이터 상태 */}
                        <span className={`px-3 py-1 rounded-full text-sm ${
                            todayData
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {todayData ? '✓ 오늘 입력 완료' : '⚠ 오늘 미입력'}
                        </span>

                        <button
                            onClick={() => setShowNewForm(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            추가
                        </button>
                    </div>
                </div>

                {/* 신규 입력 폼 */}
                {showNewForm && (
                    <div className="p-4 bg-blue-50 border-b">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">날짜</label>
                                <input
                                    type="date"
                                    value={newData.date}
                                    min={wigCreatedDate}
                                    max={getLocalToday()}
                                    onChange={e => {
                                        const date = new Date(e.target.value);
                                        setNewData({
                                            ...newData,
                                            date: e.target.value,
                                            dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
                                        });
                                    }}
                                    className="p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">요일</label>
                                <input
                                    type="text"
                                    value={newData.dayOfWeek}
                                    readOnly
                                    className="p-2 border rounded w-16 bg-gray-100"
                                />
                            </div>
                            {selectedWig.leadMeasures?.[0] && (
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">{selectedWig.leadMeasures[0].name}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder={`목표: ${selectedWig.leadMeasures[0].dailyTarget}`}
                                        value={newData.lead1}
                                        onChange={e => setNewData({...newData, lead1: e.target.value})}
                                        className="p-2 border rounded w-28"
                                    />
                                </div>
                            )}
                            {selectedWig.leadMeasures?.[1] && (
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">{selectedWig.leadMeasures[1].name}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder={`목표: ${selectedWig.leadMeasures[1].dailyTarget}`}
                                        value={newData.lead2}
                                        onChange={e => setNewData({...newData, lead2: e.target.value})}
                                        className="p-2 border rounded w-28"
                                    />
                                </div>
                            )}
                            <div className="flex items-end gap-2">
                                <button onClick={handleCreate} className="p-2 bg-green-600 text-white rounded hover:bg-green-700">
                                    <Check size={18} />
                                </button>
                                <button onClick={() => setShowNewForm(false)} className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 주간 합산 요약 + Actual 입력 (NUMERIC 타입만) */}
                <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="text-sm text-gray-600">
                            <strong>{selectedWeek} 주간 합산:</strong>
                            {(() => {
                                const weekSummary = weeklyChartData.find(w => w.week === selectedWeek);
                                return (
                                    <span className="ml-2">
                                        {selectedWig.leadMeasures?.[0] && (
                                            <span className="mr-4">{selectedWig.leadMeasures[0].name}: {weekSummary?.lead1 || 0} {selectedWig.leadMeasures[0].unit}</span>
                                        )}
                                        {selectedWig.leadMeasures?.[1] && (
                                            <span>{selectedWig.leadMeasures[1].name}: {weekSummary?.lead2 || 0} {selectedWig.leadMeasures[1].unit}</span>
                                        )}
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
                                                            actual: parseFloat(newWeeklyActual) || null
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
                            {selectedWig.leadMeasures?.[0] && (
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    {selectedWig.leadMeasures[0].name} ({selectedWig.leadMeasures[0].unit})
                                </th>
                            )}
                            {selectedWig.leadMeasures?.[1] && (
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    {selectedWig.leadMeasures[1].name} ({selectedWig.leadMeasures[1].unit})
                                </th>
                            )}
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
                                        {selectedWig.leadMeasures?.[0] && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={editData.lead1 || ''}
                                                    onChange={e => setEditData({...editData, lead1: e.target.value})}
                                                    className="p-1 border rounded w-20"
                                                />
                                            </td>
                                        )}
                                        {selectedWig.leadMeasures?.[1] && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={editData.lead2 || ''}
                                                    onChange={e => setEditData({...editData, lead2: e.target.value})}
                                                    className="p-1 border rounded w-20"
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleUpdate(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded mr-1">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    // 보기 모드
                                    <>
                                        <td className="px-4 py-3">{item.date}</td>
                                        <td className="px-4 py-3">{item.dayOfWeek}</td>
                                        {selectedWig.leadMeasures?.[0] && (
                                            <td className="px-4 py-3">{item.lead1 ?? 0}</td>
                                        )}
                                        {selectedWig.leadMeasures?.[1] && (
                                            <td className="px-4 py-3">{item.lead2 ?? 0}</td>
                                        )}
                                        <td className="px-4 py-3 text-center">
                                            {item.isEmpty ? (
                                                // 빈 데이터: 클릭하면 해당 날짜로 추가
                                                <button
                                                    onClick={() => {
                                                        setNewData({
                                                            date: item.date,
                                                            dayOfWeek: item.dayOfWeek,
                                                            lead1: '',
                                                            lead2: ''
                                                        });
                                                        setShowNewForm(true);
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
                                    {selectedWeek} 주차 데이터가 없습니다. 위의 "추가" 버튼을 눌러 데이터를 입력하세요.
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