import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp, Target, Activity, Flag, TrendingUp, BarChart3 } from 'lucide-react';
import wigApi from '../api/wigApi';
import milestoneApi from '../api/milestoneApi';
import leadMeasureApi from '../api/leadMeasureApi';
import weeklyDataApi from '../api/weeklyDataApi';

const WIGManagement = ({ wigs, onWigChange }) => {
    // WIG 관련 상태
    const [showNewWigForm, setShowNewWigForm] = useState(false);
    const [editingWig, setEditingWig] = useState(null);
    const [wigCount, setWigCount] = useState(0);
    const [expandedWigId, setExpandedWigId] = useState(null);

    // Weekly Data (Lag Measure 현재값)
    const [weeklyDataMap, setWeeklyDataMap] = useState({}); // { wigId: [weeklyData...] }

    // Lead Measure 관련 상태
    const [showLeadMeasureForm, setShowLeadMeasureForm] = useState(null);
    const [editingLeadMeasure, setEditingLeadMeasure] = useState(null);
    const [newLeadMeasure, setNewLeadMeasure] = useState({
        name: '',
        dailyTarget: '',
        weeklyTarget: '',
        unit: ''
    });

    // Milestone 관련 상태
    const [showMilestoneForm, setShowMilestoneForm] = useState(null);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [newMilestone, setNewMilestone] = useState({
        name: '',
        orderIndex: 1
    });

    // WIG 폼 상태
    const [newWig, setNewWig] = useState({
        title: '',
        fromX: '',
        toY: '',
        byWhen: '',
        measureType: 'NUMERIC',
        unit: ''
    });

    useEffect(() => {
        loadWigCount();
        loadAllWeeklyData();
    }, [wigs]);

    const loadWigCount = async () => {
        try {
            const data = await wigApi.getCount();
            setWigCount(data.count);
        } catch (err) {
            console.error('WIG 개수 조회 실패:', err);
        }
    };

    // 모든 WIG의 Weekly Data 로드
    const loadAllWeeklyData = async () => {
        const dataMap = {};
        for (const wig of wigs) {
            try {
                const data = await weeklyDataApi.getByWigId(wig.id);
                dataMap[wig.id] = data;
            } catch (err) {
                console.error(`WIG ${wig.id} Weekly Data 로드 실패:`, err);
                dataMap[wig.id] = [];
            }
        }
        setWeeklyDataMap(dataMap);
    };

    // 최신 Weekly Data 가져오기
    const getLatestWeeklyData = (wigId) => {
        const data = weeklyDataMap[wigId] || [];
        if (data.length === 0) return null;
        // week 기준 정렬 후 최신 데이터 반환
        return data.sort((a, b) => b.week.localeCompare(a.week))[0];
    };

    // Lag Measure 진행률 계산
    const getLagProgress = (wig) => {
        if (wig.measureType === 'STATE') {
            if (!wig.milestones || wig.milestones.length === 0) return 0;
            const completed = wig.milestones.filter(m => m.completed).length;
            return ((completed / wig.milestones.length) * 100).toFixed(1);
        } else {
            // NUMERIC: fromX → toY 기준 진행률
            const latest = getLatestWeeklyData(wig.id);
            if (!latest || !latest.actual) return 0;

            const from = parseFloat(wig.fromX) || 0;
            const to = parseFloat(wig.toY) || 0;
            const current = latest.actual;

            if (from === to) return 100;

            // 감소 목표 (체중 감량 등)
            if (from > to) {
                const progress = ((from - current) / (from - to)) * 100;
                return Math.min(100, Math.max(0, progress)).toFixed(1);
            }
            // 증가 목표
            const progress = ((current - from) / (to - from)) * 100;
            return Math.min(100, Math.max(0, progress)).toFixed(1);
        }
    };

    // 현재 Lag 값 표시
    const getCurrentLagValue = (wig) => {
        if (wig.measureType === 'STATE') {
            const completed = wig.milestones?.filter(m => m.completed).length || 0;
            const total = wig.milestones?.length || 0;
            return `${completed}/${total} 완료`;
        } else {
            const latest = getLatestWeeklyData(wig.id);
            if (latest?.actual) {
                return `${latest.actual} ${wig.unit}`;
            }
            return `${wig.fromX} ${wig.unit} (시작값)`;
        }
    };

    // ========================
    // WIG CRUD
    // ========================
    const handleCreateWig = async () => {
        try {
            await wigApi.create(newWig);
            setNewWig({ title: '', fromX: '', toY: '', byWhen: '', measureType: 'NUMERIC', unit: '' });
            setShowNewWigForm(false);
            onWigChange();
        } catch (err) {
            console.error('WIG 생성 실패:', err);
            alert(err.message || 'WIG 생성에 실패했습니다.');
        }
    };

    const handleUpdateWig = async () => {
        try {
            await wigApi.update(editingWig.id, editingWig);
            setEditingWig(null);
            onWigChange();
        } catch (err) {
            console.error('WIG 수정 실패:', err);
            alert(err.message || 'WIG 수정에 실패했습니다.');
        }
    };

    const handleDeleteWig = async (id) => {
        if (!confirm('정말 이 WIG를 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.')) return;
        try {
            await wigApi.delete(id);
            onWigChange();
        } catch (err) {
            console.error('WIG 삭제 실패:', err);
            alert(err.message || 'WIG 삭제에 실패했습니다.');
        }
    };

    // ========================
    // Lead Measure CRUD
    // ========================
    const handleCreateLeadMeasure = async (wigId) => {
        try {
            await leadMeasureApi.create({
                ...newLeadMeasure,
                dailyTarget: parseFloat(newLeadMeasure.dailyTarget),
                weeklyTarget: parseFloat(newLeadMeasure.weeklyTarget),
                wigId
            });
            setNewLeadMeasure({ name: '', dailyTarget: '', weeklyTarget: '', unit: '' });
            setShowLeadMeasureForm(null);
            onWigChange();
        } catch (err) {
            console.error('Lead Measure 생성 실패:', err);
            alert(err.message || 'Lead Measure 생성에 실패했습니다.');
        }
    };

    const handleUpdateLeadMeasure = async () => {
        try {
            await leadMeasureApi.update(editingLeadMeasure.id, {
                name: editingLeadMeasure.name,
                dailyTarget: parseFloat(editingLeadMeasure.dailyTarget),
                weeklyTarget: parseFloat(editingLeadMeasure.weeklyTarget),
                unit: editingLeadMeasure.unit
            });
            setEditingLeadMeasure(null);
            onWigChange();
        } catch (err) {
            console.error('Lead Measure 수정 실패:', err);
            alert(err.message || 'Lead Measure 수정에 실패했습니다.');
        }
    };

    const handleDeleteLeadMeasure = async (id) => {
        if (!confirm('이 Lead Measure를 삭제하시겠습니까?')) return;
        try {
            await leadMeasureApi.delete(id);
            onWigChange();
        } catch (err) {
            console.error('Lead Measure 삭제 실패:', err);
            alert(err.message || 'Lead Measure 삭제에 실패했습니다.');
        }
    };

    // ========================
    // Milestone CRUD
    // ========================
    const handleCreateMilestone = async (wigId) => {
        const wig = wigs.find(w => w.id === wigId);
        const maxOrder = wig?.milestones?.length > 0
            ? Math.max(...wig.milestones.map(m => m.orderIndex)) + 1
            : 1;

        try {
            await milestoneApi.create({
                name: newMilestone.name,
                orderIndex: maxOrder,
                wigId
            });
            setNewMilestone({ name: '', orderIndex: 1 });
            setShowMilestoneForm(null);
            onWigChange();
        } catch (err) {
            console.error('Milestone 생성 실패:', err);
            alert(err.message || 'Milestone 생성에 실패했습니다.');
        }
    };

    const handleUpdateMilestone = async () => {
        try {
            await milestoneApi.update(editingMilestone.id, {
                name: editingMilestone.name,
                orderIndex: editingMilestone.orderIndex
            });
            setEditingMilestone(null);
            onWigChange();
        } catch (err) {
            console.error('Milestone 수정 실패:', err);
            alert(err.message || 'Milestone 수정에 실패했습니다.');
        }
    };

    const handleDeleteMilestone = async (id) => {
        if (!confirm('이 Milestone을 삭제하시겠습니까?')) return;
        try {
            await milestoneApi.delete(id);
            onWigChange();
        } catch (err) {
            console.error('Milestone 삭제 실패:', err);
            alert(err.message || 'Milestone 삭제에 실패했습니다.');
        }
    };

    const handleMilestoneToggle = async (milestoneId) => {
        try {
            await milestoneApi.toggleCompleted(milestoneId);
            onWigChange();
        } catch (err) {
            console.error('마일스톤 토글 실패:', err);
            alert('마일스톤 상태 변경에 실패했습니다.');
        }
    };

    // ========================
    // 렌더링
    // ========================
    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Target className="text-blue-600" size={24} />
                    내 WIGs ({wigCount}/2)
                </h3>
                <button
                    onClick={() => setShowNewWigForm(true)}
                    disabled={wigCount >= 2}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                        wigCount >= 2
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                >
                    <Plus size={18} />
                    새 WIG 추가
                </button>
            </div>

            {/* WIG 생성 폼 */}
            {showNewWigForm && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg text-blue-900">새 WIG 만들기</h4>
                        <button onClick={() => setShowNewWigForm(false)} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="목표 제목 (예: 체중 감량)"
                            value={newWig.title}
                            onChange={e => setNewWig({...newWig, title: e.target.value})}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <select
                            value={newWig.measureType}
                            onChange={e => setNewWig({...newWig, measureType: e.target.value})}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="NUMERIC">수치형 (숫자 목표)</option>
                            <option value="STATE">상태형 (마일스톤)</option>
                        </select>
                        <input
                            type="text"
                            placeholder="시작값 (예: 80)"
                            value={newWig.fromX}
                            onChange={e => setNewWig({...newWig, fromX: e.target.value})}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="목표값 (예: 70)"
                            value={newWig.toY}
                            onChange={e => setNewWig({...newWig, toY: e.target.value})}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="기한 (예: 2025년 3월)"
                            value={newWig.byWhen}
                            onChange={e => setNewWig({...newWig, byWhen: e.target.value})}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="단위 (예: kg, 개, 시간)"
                            value={newWig.unit}
                            onChange={e => setNewWig({...newWig, unit: e.target.value})}
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowNewWigForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleCreateWig}
                            disabled={!newWig.title || !newWig.fromX || !newWig.toY || !newWig.byWhen}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Check size={18} />
                            생성
                        </button>
                    </div>
                </div>
            )}

            {/* WIG 목록 */}
            <div className="space-y-4">
                {wigs.map(wig => {
                    const lagProgress = getLagProgress(wig);
                    const currentLag = getCurrentLagValue(wig);
                    const latestData = getLatestWeeklyData(wig.id);

                    return (
                        <div key={wig.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                            {/* WIG 헤더 */}
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedWigId(expandedWigId === wig.id ? null : wig.id)}
                            >
                                {editingWig?.id === wig.id ? (
                                    // 수정 모드
                                    <div className="space-y-3" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingWig.title}
                                            onChange={e => setEditingWig({...editingWig, title: e.target.value})}
                                            className="w-full p-2 border rounded-lg text-lg font-bold"
                                        />
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <input
                                                type="text"
                                                placeholder="시작값"
                                                value={editingWig.fromX}
                                                onChange={e => setEditingWig({...editingWig, fromX: e.target.value})}
                                                className="p-2 border rounded"
                                            />
                                            <input
                                                type="text"
                                                placeholder="목표값"
                                                value={editingWig.toY}
                                                onChange={e => setEditingWig({...editingWig, toY: e.target.value})}
                                                className="p-2 border rounded"
                                            />
                                            <input
                                                type="text"
                                                placeholder="기한"
                                                value={editingWig.byWhen}
                                                onChange={e => setEditingWig({...editingWig, byWhen: e.target.value})}
                                                className="p-2 border rounded"
                                            />
                                            <input
                                                type="text"
                                                placeholder="단위"
                                                value={editingWig.unit}
                                                onChange={e => setEditingWig({...editingWig, unit: e.target.value})}
                                                className="p-2 border rounded"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateWig}
                                                className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                                            >
                                                <Check size={16} /> 저장
                                            </button>
                                            <button
                                                onClick={() => setEditingWig(null)}
                                                className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // 보기 모드
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-lg font-bold text-gray-900">{wig.title}</h4>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        wig.measureType === 'NUMERIC'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {wig.measureType === 'NUMERIC' ? '수치형' : '상태형'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-1">
                                                    {wig.fromX} → {wig.toY} {wig.unit} | 기한: {wig.byWhen}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingWig(wig); }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="WIG 수정"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteWig(wig.id); }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="WIG 삭제"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                {expandedWigId === wig.id
                                                    ? <ChevronUp size={20} className="text-gray-400" />
                                                    : <ChevronDown size={20} className="text-gray-400" />
                                                }
                                            </div>
                                        </div>

                                        {/* Lag Measure 현재 상태 표시 */}
                                        <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-orange-800 flex items-center gap-1">
                                                    <BarChart3 size={16} />
                                                    Lag Measure (지연지표)
                                                </span>
                                                <span className="text-sm font-bold text-orange-900">
                                                    {currentLag}
                                                </span>
                                            </div>
                                            <div className="w-full bg-orange-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${lagProgress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-orange-600 mt-1">
                                                <span>{wig.fromX} {wig.unit}</span>
                                                <span className="font-semibold">{lagProgress}%</span>
                                                <span>{wig.toY} {wig.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 확장된 내용 */}
                            {expandedWigId === wig.id && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-6">

                                    {/* Lead Measures 섹션 */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <Activity className="text-blue-500" size={18} />
                                                Lead Measures (선행지표)
                                            </h5>
                                            <button
                                                onClick={() => setShowLeadMeasureForm(wig.id)}
                                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                                            >
                                                <Plus size={14} /> 추가
                                            </button>
                                        </div>

                                        {/* Lead Measure 추가 폼 */}
                                        {showLeadMeasureForm === wig.id && (
                                            <div className="bg-white p-4 rounded-lg border border-blue-200 mb-3">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="지표명"
                                                        value={newLeadMeasure.name}
                                                        onChange={e => setNewLeadMeasure({...newLeadMeasure, name: e.target.value})}
                                                        className="p-2 border rounded"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="일일 목표"
                                                        value={newLeadMeasure.dailyTarget}
                                                        onChange={e => setNewLeadMeasure({...newLeadMeasure, dailyTarget: e.target.value})}
                                                        className="p-2 border rounded"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="주간 목표"
                                                        value={newLeadMeasure.weeklyTarget}
                                                        onChange={e => setNewLeadMeasure({...newLeadMeasure, weeklyTarget: e.target.value})}
                                                        className="p-2 border rounded"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="단위"
                                                        value={newLeadMeasure.unit}
                                                        onChange={e => setNewLeadMeasure({...newLeadMeasure, unit: e.target.value})}
                                                        className="p-2 border rounded"
                                                    />
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleCreateLeadMeasure(wig.id)}
                                                        disabled={!newLeadMeasure.name || !newLeadMeasure.dailyTarget}
                                                        className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300"
                                                    >
                                                        추가
                                                    </button>
                                                    <button
                                                        onClick={() => { setShowLeadMeasureForm(null); setNewLeadMeasure({ name: '', dailyTarget: '', weeklyTarget: '', unit: '' }); }}
                                                        className="px-4 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lead Measure 목록 - 현재 실적 포함 */}
                                        {wig.leadMeasures && wig.leadMeasures.length > 0 ? (
                                            <div className="space-y-2">
                                                {wig.leadMeasures.map((lead, idx) => {
                                                    // 최신 주간 데이터에서 lead 실적 가져오기
                                                    const leadActual = latestData ? (idx === 0 ? latestData.lead1 : latestData.lead2) : null;
                                                    const weeklyProgress = leadActual && lead.weeklyTarget
                                                        ? ((leadActual / lead.weeklyTarget) * 100).toFixed(0)
                                                        : 0;

                                                    return (
                                                        <div key={lead.id} className="bg-white p-3 rounded-lg border">
                                                            {editingLeadMeasure?.id === lead.id ? (
                                                                // 수정 모드
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editingLeadMeasure.name}
                                                                        onChange={e => setEditingLeadMeasure({...editingLeadMeasure, name: e.target.value})}
                                                                        className="p-1 border rounded flex-1"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        value={editingLeadMeasure.dailyTarget}
                                                                        onChange={e => setEditingLeadMeasure({...editingLeadMeasure, dailyTarget: e.target.value})}
                                                                        className="p-1 border rounded w-20"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        value={editingLeadMeasure.weeklyTarget}
                                                                        onChange={e => setEditingLeadMeasure({...editingLeadMeasure, weeklyTarget: e.target.value})}
                                                                        className="p-1 border rounded w-20"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={editingLeadMeasure.unit}
                                                                        onChange={e => setEditingLeadMeasure({...editingLeadMeasure, unit: e.target.value})}
                                                                        className="p-1 border rounded w-16"
                                                                    />
                                                                    <button onClick={handleUpdateLeadMeasure} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                                        <Check size={16} />
                                                                    </button>
                                                                    <button onClick={() => setEditingLeadMeasure(null)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                // 보기 모드
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium">{lead.name}</span>
                                                                            <span className="text-gray-500 text-sm">
                                                                                (일 {lead.dailyTarget}{lead.unit} / 주 {lead.weeklyTarget}{lead.unit})
                                                                            </span>
                                                                        </div>
                                                                        {leadActual !== null && (
                                                                            <div className="mt-2">
                                                                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                                                    <span>이번 주 실적: {leadActual} {lead.unit}</span>
                                                                                    <span>{weeklyProgress}%</span>
                                                                                </div>
                                                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                                    <div
                                                                                        className={`h-1.5 rounded-full ${
                                                                                            weeklyProgress >= 100 ? 'bg-green-500' :
                                                                                                weeklyProgress >= 70 ? 'bg-blue-500' : 'bg-yellow-500'
                                                                                        }`}
                                                                                        style={{ width: `${Math.min(100, weeklyProgress)}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-1 ml-2">
                                                                        <button
                                                                            onClick={() => setEditingLeadMeasure(lead)}
                                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteLeadMeasure(lead.id)}
                                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">Lead Measure가 없습니다. 추가해보세요!</p>
                                        )}
                                    </div>

                                    {/* Milestones 섹션 (STATE 타입만) */}
                                    {wig.measureType === 'STATE' && (
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                                    <Flag className="text-purple-500" size={18} />
                                                    Milestones (마일스톤)
                                                </h5>
                                                <button
                                                    onClick={() => setShowMilestoneForm(wig.id)}
                                                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1"
                                                >
                                                    <Plus size={14} /> 추가
                                                </button>
                                            </div>

                                            {/* Milestone 추가 폼 */}
                                            {showMilestoneForm === wig.id && (
                                                <div className="bg-white p-4 rounded-lg border border-purple-200 mb-3">
                                                    <input
                                                        type="text"
                                                        placeholder="마일스톤 이름 (예: 이력서 완성)"
                                                        value={newMilestone.name}
                                                        onChange={e => setNewMilestone({...newMilestone, name: e.target.value})}
                                                        className="w-full p-2 border rounded mb-3"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCreateMilestone(wig.id)}
                                                            disabled={!newMilestone.name}
                                                            className="px-4 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-300"
                                                        >
                                                            추가
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowMilestoneForm(null); setNewMilestone({ name: '', orderIndex: 1 }); }}
                                                            className="px-4 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Milestone 목록 */}
                                            {wig.milestones && wig.milestones.length > 0 ? (
                                                <div className="space-y-2">
                                                    {wig.milestones.sort((a, b) => a.orderIndex - b.orderIndex).map(milestone => (
                                                        <div key={milestone.id} className="bg-white p-3 rounded-lg border flex items-center justify-between">
                                                            {editingMilestone?.id === milestone.id ? (
                                                                // 수정 모드
                                                                <div className="flex-1 flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editingMilestone.name}
                                                                        onChange={e => setEditingMilestone({...editingMilestone, name: e.target.value})}
                                                                        className="p-1 border rounded flex-1"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        value={editingMilestone.orderIndex}
                                                                        onChange={e => setEditingMilestone({...editingMilestone, orderIndex: parseInt(e.target.value)})}
                                                                        className="p-1 border rounded w-16"
                                                                        title="순서"
                                                                    />
                                                                    <button onClick={handleUpdateMilestone} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                                        <Check size={16} />
                                                                    </button>
                                                                    <button onClick={() => setEditingMilestone(null)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                // 보기 모드
                                                                <>
                                                                    <div className="flex items-center gap-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={milestone.completed}
                                                                            onChange={() => handleMilestoneToggle(milestone.id)}
                                                                            className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                                                                        />
                                                                        <span className={`${milestone.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                                            {milestone.orderIndex}. {milestone.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => setEditingMilestone(milestone)}
                                                                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteMilestone(milestone.id)}
                                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">마일스톤이 없습니다. 추가해보세요!</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 빈 상태 */}
            {wigs.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Target className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 text-lg">아직 WIG가 없습니다</p>
                    <p className="text-gray-400 text-sm mt-1">위의 "새 WIG 추가" 버튼을 눌러 목표를 설정해보세요!</p>
                </div>
            )}
        </div>
    );
};

export default WIGManagement;