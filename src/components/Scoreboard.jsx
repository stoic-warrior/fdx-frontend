import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Cell, ReferenceLine } from 'recharts';
import { BarChart3, LineChartIcon } from 'lucide-react';
import weeklyDataApi from '../api/weeklyDataApi';
import dailyDataApi from '../api/dailyDataApi';

const Scoreboard = ({ wigs, selectedWigId, onSelectWig }) => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [dailyData, setDailyData] = useState({});
    const [loading, setLoading] = useState(false);
    const [chartTypes, setChartTypes] = useState({
        lag: 'line',
        milestone: 'bar',
        lead1: 'line',
        lead2: 'line'
    });
    const [leadTimeViews, setLeadTimeViews] = useState({ 1: 'weekly', 2: 'weekly' });
    const [selectedWeeks, setSelectedWeeks] = useState({ 1: 'W1', 2: 'W1' });

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
            setWeeklyData(weekly);

            const dailyPromises = ['W1', 'W2', 'W3', 'W4'].map(async (week) => {
                try {
                    const data = await dailyDataApi.getByWigIdAndWeek(selectedWigId, week);
                    return [week, data];
                } catch {
                    return [week, []];
                }
            });

            const dailyResults = await Promise.all(dailyPromises);
            const dailyMap = Object.fromEntries(dailyResults);
            setDailyData(dailyMap);
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

    const toggleLeadTimeView = (leadId) => {
        setLeadTimeViews(prev => ({
            ...prev,
            [leadId]: prev[leadId] === 'weekly' ? 'daily' : 'weekly'
        }));
    };

    if (loading) {
        return <div className="text-center py-12">로딩 중...</div>;
    }

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedWig.leadMeasures && selectedWig.leadMeasures.map((lead, idx) => {
                    const timeView = leadTimeViews[lead.id] || 'weekly';
                    const selectedWeek = selectedWeeks[lead.id] || 'W1';
                    const dataToShow = timeView === 'daily' ? (dailyData[selectedWeek] || []) : weeklyData;
                    const xKey = timeView === 'daily' ? 'dayOfWeek' : 'week';
                    const targetValue = timeView === 'daily' ? lead.dailyTarget : lead.weeklyTarget;
                    const chartKey = `lead${idx + 1}`;

                    return (
                        <div key={lead.id} className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Lead: {lead.name}</h3>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleChartType(chartKey)}
                                        className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        {chartTypes[chartKey] === 'line' ? <BarChart3 size={16} /> : <LineChartIcon size={16} />}
                                    </button>

                                    <div className="flex bg-gray-200 rounded-lg p-0.5">
                                        <button
                                            onClick={() => toggleLeadTimeView(lead.id)}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                timeView === 'daily' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                                            }`}>
                                            일간
                                        </button>
                                        <button
                                            onClick={() => toggleLeadTimeView(lead.id)}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                timeView === 'weekly' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                                            }`}>
                                            주간
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {timeView === 'daily' && (
                                <div className="mb-3 flex items-center space-x-2">
                                    <span className="text-sm font-semibold text-gray-600">주 선택:</span>
                                    {['W1', 'W2', 'W3', 'W4'].map(week => (
                                        <button
                                            key={week}
                                            onClick={() => setSelectedWeeks(prev => ({ ...prev, [lead.id]: week }))}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                selectedWeek === week ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}>
                                            {week}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={dataToShow}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey={xKey} />
                                    <YAxis />
                                    <Tooltip />
                                    <ReferenceLine y={targetValue} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey={`lead${idx + 1}`} stroke={idx === 0 ? "#10b981" : "#f59e0b"} strokeWidth={3} name={lead.name} />
                                </LineChart>
                            </ResponsiveContainer>

                            <div className="mt-4 p-3 bg-gray-50 rounded">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600">목표</p>
                                        <p className="text-lg font-bold">{targetValue} {lead.unit}</p>
                                    </div>
                                    {dataToShow.length > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-600">최근</p>
                                            <p className={`text-lg font-bold ${
                                                dataToShow[dataToShow.length - 1][`lead${idx + 1}`] >= targetValue ? 'text-green-600' : 'text-orange-600'
                                            }`}>
                                                {dataToShow[dataToShow.length - 1][`lead${idx + 1}`]} {lead.unit}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Scoreboard;