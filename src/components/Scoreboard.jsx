import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import weeklyDataApi from '../api/weeklyDataApi';
import dailyDataApi from '../api/dailyDataApi';

/**
 * 옵션 3: Scoreboard + 데이터 테이블 + 입력
 * - 차트 보면서 데이터 추가/수정/삭제
 */
const ScoreboardB = ({ wigs, selectedWigId, onSelectWig }) => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [dailyData, setDailyData] = useState({});
    const [loading, setLoading] = useState(false);
    const [chartTypes, setChartTypes] = useState({ lag: 'line', lead1: 'line', lead2: 'line' });
    const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'daily'
    const [selectedWeek, setSelectedWeek] = useState('W1');

    // 편집 상태
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // 신규 입력 상태
    const [showNewForm, setShowNewForm] = useState(false);
    const [newData, setNewData] = useState({
        week: 'W1',
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: '월',
        actual: '',
        target: '',
        lead1: '',
        lead2: ''
    });

    const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];

    useEffect(() => {
        if (selectedWigId) {
            loadData();
        }
    }, [selectedWigId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const weekly = await weeklyDataApi.getByWigId(selectedWigId);
            setWeeklyData(weekly.sort((a, b) => a.week.localeCompare(b.week)));

            const dailyPromises = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map(async (week) => {
                try {
                    const data = await dailyDataApi.getByWigIdAndWeek(selectedWigId, week);
                    return [week, data];
                } catch {
                    return [week, []];
                }
            });

            const dailyResults = await Promise.all(dailyPromises);
            setDailyData(Object.fromEntries(dailyResults));
        } catch (err) {
            console.error('데이터 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleChartType = (chartId) => {
        setChartTypes(prev => ({
            ...prev,
            [chartId]: prev[chartId] === 'line' ? 'bar' : 'line'
        }));
    };

    // 신규 데이터 저장
    const handleCreate = async () => {
        try {
            if (activeTab === 'weekly') {
                await weeklyDataApi.create({
                    week: newData.week,
                    actual: newData.actual ? parseFloat(newData.actual) : null,
                    target: newData.target ? parseFloat(newData.target) : null,
                    lead1: newData.lead1 ? parseFloat(newData.lead1) : null,
                    lead2: newData.lead2 ? parseFloat(newData.lead2) : null,
                    wigId: selectedWigId
                });
            } else {
                await dailyDataApi.create({
                    date: newData.date,
                    week: selectedWeek,
                    dayOfWeek: newData.dayOfWeek,
                    lead1: newData.lead1 ? parseFloat(newData.lead1) : null,
                    lead2: newData.lead2 ? parseFloat(newData.lead2) : null,
                    wigId: selectedWigId
                });
            }
            setShowNewForm(false);
            setNewData({ week: 'W1', date: '', dayOfWeek: '월', actual: '', target: '', lead1: '', lead2: '' });
            loadData();
        } catch (err) {
            console.error('저장 실패:', err);
            alert(err.message || '저장에 실패했습니다.');
        }
    };

    // 데이터 수정
    const handleUpdate = async (id) => {
        try {
            if (activeTab === 'weekly') {
                await weeklyDataApi.update(id, {
                    week: editData.week,
                    actual: editData.actual ? parseFloat(editData.actual) : null,
                    target: editData.target ? parseFloat(editData.target) : null,
                    lead1: editData.lead1 ? parseFloat(editData.lead1) : null,
                    lead2: editData.lead2 ? parseFloat(editData.lead2) : null
                });
            } else {
                await dailyDataApi.update(id, {
                    date: editData.date,
                    week: editData.week,
                    dayOfWeek: editData.dayOfWeek,
                    lead1: editData.lead1 ? parseFloat(editData.lead1) : null,
                    lead2: editData.lead2 ? parseFloat(editData.lead2) : null
                });
            }
            setEditingId(null);
            loadData();
        } catch (err) {
            console.error('수정 실패:', err);
            alert('수정에 실패했습니다.');
        }
    };

    // 데이터 삭제
    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            if (activeTab === 'weekly') {
                await weeklyDataApi.delete(id);
            } else {
                await dailyDataApi.delete(id);
            }
            loadData();
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

    const currentDailyData = dailyData[selectedWeek] || [];

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
                            <h3 className="text-lg font-bold">Lag: {selectedWig.title}</h3>
                            <button
                                onClick={() => toggleChartType('lag')}
                                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                {chartTypes.lag === 'line' ? <BarChart3 size={16} /> : <LineChartIcon size={16} />}
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            {chartTypes.lag === 'line' ? (
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip />
                                    <ReferenceLine y={parseFloat(selectedWig.toY)} stroke="#ef4444" strokeDasharray="5 5" label="목표" />
                                    <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} name="실제" />
                                    <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" name="계획" />
                                </LineChart>
                            ) : (
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip />
                                    <Bar dataKey="actual" fill="#3b82f6" name="실제" />
                                    <Bar dataKey="target" fill="#10b981" name="계획" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Lead Measure 차트들 */}
                {selectedWig.leadMeasures?.map((lead, idx) => (
                    <div key={lead.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Lead: {lead.name}</h3>
                            <button
                                onClick={() => toggleChartType(`lead${idx + 1}`)}
                                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                {chartTypes[`lead${idx + 1}`] === 'line' ? <BarChart3 size={16} /> : <LineChartIcon size={16} />}
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            {chartTypes[`lead${idx + 1}`] === 'line' ? (
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis />
                                    <Tooltip />
                                    <ReferenceLine y={lead.weeklyTarget} stroke="#ef4444" strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey={`lead${idx + 1}`} stroke={idx === 0 ? "#10b981" : "#f59e0b"} strokeWidth={3} name={lead.name} />
                                </LineChart>
                            ) : (
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis />
                                    <Tooltip />
                                    <ReferenceLine y={lead.weeklyTarget} stroke="#ef4444" strokeDasharray="5 5" />
                                    <Bar dataKey={`lead${idx + 1}`} fill={idx === 0 ? "#10b981" : "#f59e0b"} name={lead.name} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                        <div className="mt-2 text-sm text-gray-600 text-center">
                            주간 목표: {lead.weeklyTarget} {lead.unit}
                        </div>
                    </div>
                ))}
            </div>

            {/* 데이터 테이블 영역 */}
            <div className="bg-white rounded-lg shadow">
                {/* 테이블 헤더 */}
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('weekly')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            주간 데이터
                        </button>
                        <button
                            onClick={() => setActiveTab('daily')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeTab === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            일간 데이터
                        </button>
                    </div>

                    <button
                        onClick={() => setShowNewForm(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        추가
                    </button>
                </div>

                {/* 일간 데이터일 때 주차 선택 */}
                {activeTab === 'daily' && (
                    <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">주차 선택:</span>
                        {['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map(week => (
                            <button
                                key={week}
                                onClick={() => setSelectedWeek(week)}
                                className={`px-3 py-1 rounded text-sm ${
                                    selectedWeek === week
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {week}
                            </button>
                        ))}
                    </div>
                )}

                {/* 신규 입력 폼 */}
                {showNewForm && (
                    <div className="p-4 bg-blue-50 border-b">
                        <div className="flex items-center gap-4 flex-wrap">
                            {activeTab === 'weekly' ? (
                                <>
                                    <select
                                        value={newData.week}
                                        onChange={e => setNewData({...newData, week: e.target.value})}
                                        className="p-2 border rounded"
                                    >
                                        {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                    {selectedWig.measureType === 'NUMERIC' && (
                                        <>
                                            <input
                                                type="number"
                                                placeholder={`실제 (${selectedWig.unit})`}
                                                value={newData.actual}
                                                onChange={e => setNewData({...newData, actual: e.target.value})}
                                                className="p-2 border rounded w-28"
                                            />
                                            <input
                                                type="number"
                                                placeholder={`목표 (${selectedWig.unit})`}
                                                value={newData.target}
                                                onChange={e => setNewData({...newData, target: e.target.value})}
                                                className="p-2 border rounded w-28"
                                            />
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <input
                                        type="date"
                                        value={newData.date}
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
                                    <input
                                        type="text"
                                        value={newData.dayOfWeek}
                                        readOnly
                                        className="p-2 border rounded w-16 bg-gray-100"
                                    />
                                </>
                            )}
                            {selectedWig.leadMeasures?.[0] && (
                                <input
                                    type="number"
                                    placeholder={`${selectedWig.leadMeasures[0].name}`}
                                    value={newData.lead1}
                                    onChange={e => setNewData({...newData, lead1: e.target.value})}
                                    className="p-2 border rounded w-28"
                                />
                            )}
                            {selectedWig.leadMeasures?.[1] && (
                                <input
                                    type="number"
                                    placeholder={`${selectedWig.leadMeasures[1].name}`}
                                    value={newData.lead2}
                                    onChange={e => setNewData({...newData, lead2: e.target.value})}
                                    className="p-2 border rounded w-28"
                                />
                            )}
                            <button onClick={handleCreate} className="p-2 bg-green-600 text-white rounded hover:bg-green-700">
                                <Check size={18} />
                            </button>
                            <button onClick={() => setShowNewForm(false)} className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 테이블 */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            {activeTab === 'weekly' ? (
                                <>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">주차</th>
                                    {selectedWig.measureType === 'NUMERIC' && (
                                        <>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">실제 ({selectedWig.unit})</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">목표 ({selectedWig.unit})</th>
                                        </>
                                    )}
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
                                </>
                            ) : (
                                <>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">날짜</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">요일</th>
                                    {selectedWig.leadMeasures?.[0] && (
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            {selectedWig.leadMeasures[0].name}
                                        </th>
                                    )}
                                    {selectedWig.leadMeasures?.[1] && (
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            {selectedWig.leadMeasures[1].name}
                                        </th>
                                    )}
                                </>
                            )}
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">액션</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {(activeTab === 'weekly' ? weeklyData : currentDailyData).map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                {editingId === item.id ? (
                                    // 편집 모드
                                    <>
                                        {activeTab === 'weekly' ? (
                                            <>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={editData.week}
                                                        onChange={e => setEditData({...editData, week: e.target.value})}
                                                        className="p-1 border rounded w-16"
                                                    />
                                                </td>
                                                {selectedWig.measureType === 'NUMERIC' && (
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={editData.actual || ''}
                                                                onChange={e => setEditData({...editData, actual: e.target.value})}
                                                                className="p-1 border rounded w-20"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={editData.target || ''}
                                                                onChange={e => setEditData({...editData, target: e.target.value})}
                                                                className="p-1 border rounded w-20"
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={editData.lead1 || ''}
                                                        onChange={e => setEditData({...editData, lead1: e.target.value})}
                                                        className="p-1 border rounded w-20"
                                                    />
                                                </td>
                                                {selectedWig.leadMeasures?.[1] && (
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={editData.lead2 || ''}
                                                            onChange={e => setEditData({...editData, lead2: e.target.value})}
                                                            className="p-1 border rounded w-20"
                                                        />
                                                    </td>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={editData.date}
                                                        onChange={e => setEditData({...editData, date: e.target.value})}
                                                        className="p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">{editData.dayOfWeek}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={editData.lead1 || ''}
                                                        onChange={e => setEditData({...editData, lead1: e.target.value})}
                                                        className="p-1 border rounded w-20"
                                                    />
                                                </td>
                                                {selectedWig.leadMeasures?.[1] && (
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={editData.lead2 || ''}
                                                            onChange={e => setEditData({...editData, lead2: e.target.value})}
                                                            className="p-1 border rounded w-20"
                                                        />
                                                    </td>
                                                )}
                                            </>
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
                                        {activeTab === 'weekly' ? (
                                            <>
                                                <td className="px-4 py-3 font-medium">{item.week}</td>
                                                {selectedWig.measureType === 'NUMERIC' && (
                                                    <>
                                                        <td className="px-4 py-3">{item.actual ?? '-'}</td>
                                                        <td className="px-4 py-3">{item.target ?? '-'}</td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3">{item.lead1 ?? '-'}</td>
                                                {selectedWig.leadMeasures?.[1] && (
                                                    <td className="px-4 py-3">{item.lead2 ?? '-'}</td>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3">{item.date}</td>
                                                <td className="px-4 py-3">{item.dayOfWeek}</td>
                                                <td className="px-4 py-3">{item.lead1 ?? '-'}</td>
                                                {selectedWig.leadMeasures?.[1] && (
                                                    <td className="px-4 py-3">{item.lead2 ?? '-'}</td>
                                                )}
                                            </>
                                        )}
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => startEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {(activeTab === 'weekly' ? weeklyData : currentDailyData).length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                    데이터가 없습니다. 위의 "추가" 버튼을 눌러 데이터를 입력하세요.
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

export default ScoreboardB;