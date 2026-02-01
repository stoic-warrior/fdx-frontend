import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import commitmentApi from '../api/commitmentApi';

const Commitments = ({ wigs, selectedWigId, onSelectWig }) => {
    const [commitments, setCommitments] = useState([]);
    const [previousCommitments, setPreviousCommitments] = useState([]);
    const [newCommitment, setNewCommitment] = useState('');
    const [loading, setLoading] = useState(false);

    const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];
    const currentWeek = 'W5';
    const previousWeek = 'W4';

    useEffect(() => {
        if (selectedWigId) {
            loadCommitments();
        }
    }, [selectedWigId]);

    const loadCommitments = async () => {
        try {
            setLoading(true);
            const current = await commitmentApi.getByWigIdAndWeek(selectedWigId, currentWeek);
            setCommitments(current);

            const previous = await commitmentApi.getByWigIdAndWeek(selectedWigId, previousWeek);
            setPreviousCommitments(previous);
        } catch (err) {
            console.error('Commitments 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await commitmentApi.toggleCompleted(id);
            setCommitments(commitments.map(c =>
                c.id === id ? { ...c, completed: !c.completed } : c
            ));
        } catch (err) {
            console.error('토글 실패:', err);
            alert('완료 상태 변경에 실패했습니다.');
        }
    };

    const handleAdd = async () => {
        if (!newCommitment.trim()) return;

        try {
            const created = await commitmentApi.create({
                text: newCommitment,
                week: currentWeek,
                completed: false,
                wigId: selectedWigId
            });
            setCommitments([...commitments, created]);
            setNewCommitment('');
        } catch (err) {
            console.error('Commitment 생성 실패:', err);
            alert('약속 추가에 실패했습니다.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await commitmentApi.delete(id);
            setCommitments(commitments.filter(c => c.id !== id));
        } catch (err) {
            console.error('Commitment 삭제 실패:', err);
            alert('약속 삭제에 실패했습니다.');
        }
    };

    const completionRate = commitments.length > 0
        ? ((commitments.filter(c => c.completed).length / commitments.length) * 100).toFixed(0)
        : 0;

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

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">이번 주 약속 ({currentWeek})</h3>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">이행률</p>
                        <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    {commitments.map(commitment => (
                        <div
                            key={commitment.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                commitment.completed
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-gray-200'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={commitment.completed}
                                        onChange={() => handleToggle(commitment.id)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className={commitment.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                    {commitment.text}
                  </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(commitment.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newCommitment}
                        onChange={(e) => setNewCommitment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="새로운 약속 입력..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <Plus size={20} />
                        <span>추가</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">지난 주 약속 ({previousWeek})</h3>
                <div className="space-y-2">
                    {previousCommitments.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">지난 주 약속이 없습니다.</p>
                    ) : (
                        previousCommitments.map(commitment => (
                            <div
                                key={commitment.id}
                                className={`p-3 rounded ${
                                    commitment.completed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{commitment.text}</span>
                                    <span className="text-sm">
                    {commitment.completed ? '✓ 완료' : '✗ 미완료'}
                  </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Commitments;