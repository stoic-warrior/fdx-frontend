import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import wigApi from '../api/wigApi';
import milestoneApi from '../api/milestoneApi';

const WIGManagement = ({ wigs, onWigChange }) => {
    const [showNewWigForm, setShowNewWigForm] = useState(false);
    const [editingWig, setEditingWig] = useState(null);
    const [wigCount, setWigCount] = useState(0);
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
    }, [wigs]);

    const loadWigCount = async () => {
        try {
            const data = await wigApi.getCount();
            setWigCount(data.count);
        } catch (err) {
            console.error('WIG 개수 조회 실패:', err);
        }
    };

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

    const handleMilestoneToggle = async (wigId, milestoneId) => {
        try {
            await milestoneApi.toggleCompleted(milestoneId);
            onWigChange();
        } catch (err) {
            console.error('마일스톤 토글 실패:', err);
            alert('마일스톤 상태 변경에 실패했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">내 WIGs (최대 2개)</h3>
                <button
                    onClick={() => setShowNewWigForm(true)}
                    disabled={wigCount >= 2}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                        wigCount >= 2
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    <Plus size={20} />
                    <span>새 WIG 추가</span>
                </button>
            </div>

            {showNewWigForm && (
                <div className="bg-white p-6 rounded-lg shadow border-2 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold">새로운 WIG 만들기</h4>
                        <button onClick={() => setShowNewWigForm(false)} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="목표 제목"
                            value={newWig.title}
                            onChange={(e) => setNewWig({ ...newWig, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            value={newWig.measureType}
                            onChange={(e) => setNewWig({ ...newWig, measureType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="NUMERIC">수치형</option>
                            <option value="STATE">상태형</option>
                        </select>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="From X"
                                value={newWig.fromX}
                                onChange={(e) => setNewWig({ ...newWig, fromX: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="To Y"
                                value={newWig.toY}
                                onChange={(e) => setNewWig({ ...newWig, toY: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {newWig.measureType === 'NUMERIC' && (
                            <input
                                type="text"
                                placeholder="단위 (예: kg, 원)"
                                value={newWig.unit}
                                onChange={(e) => setNewWig({ ...newWig, unit: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}

                        <input
                            type="date"
                            value={newWig.byWhen}
                            onChange={(e) => setNewWig({ ...newWig, byWhen: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="flex space-x-2">
                            <button
                                onClick={handleCreateWig}
                                disabled={!newWig.title || !newWig.fromX || !newWig.toY || !newWig.byWhen}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                저장
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewWigForm(false);
                                    setNewWig({ title: '', fromX: '', toY: '', byWhen: '', measureType: 'NUMERIC', unit: '' });
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {wigs.map(wig => (
                    <div key={wig.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-lg font-bold">{wig.title}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-gray-600">{wig.fromX}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-gray-600">{wig.toY}</span>
                                    {wig.measureType === 'NUMERIC' && wig.unit && (
                                        <span className="text-gray-500">({wig.unit})</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">by {wig.byWhen}</p>
                                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                    wig.measureType === 'NUMERIC' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                  {wig.measureType === 'NUMERIC' ? '수치형' : '상태형'}
                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleDeleteWig(wig.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {wig.measureType === 'STATE' && wig.milestones && wig.milestones.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="font-semibold text-sm text-gray-700">마일스톤:</p>
                                {wig.milestones.map(milestone => (
                                    <div key={milestone.id} className="flex items-center space-x-3 pl-4">
                                        <input
                                            type="checkbox"
                                            checked={milestone.completed}
                                            onChange={() => handleMilestoneToggle(wig.id, milestone.id)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className={milestone.completed ? 'line-through text-gray-500 text-sm' : 'text-gray-700 text-sm'}>
                      {milestone.name}
                    </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {wig.leadMeasures && wig.leadMeasures.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="font-semibold text-sm text-gray-700">Lead Measures:</p>
                                {wig.leadMeasures.map(lead => (
                                    <div key={lead.id} className="text-sm text-gray-600 pl-4">
                                        • {lead.name}: 일일 {lead.dailyTarget} {lead.unit} / 주간 {lead.weeklyTarget} {lead.unit}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WIGManagement;
