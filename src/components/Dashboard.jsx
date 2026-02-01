import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckSquare, Award } from 'lucide-react';
import commitmentApi from '../api/commitmentApi';

const Dashboard = ({ wigs, selectedWigId, onSelectWig }) => {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];
  const currentWeek = 'W5'; // 실제로는 현재 주차를 계산해야 함

  // Commitments 로드
  useEffect(() => {
    if (selectedWigId) {
      loadCommitments();
    }
  }, [selectedWigId]);

  const loadCommitments = async () => {
    try {
      setLoading(true);
      const data = await commitmentApi.getByWigIdAndWeek(selectedWigId, currentWeek);
      setCommitments(data);
    } catch (err) {
      console.error('Commitments 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 진행률 계산
  const getProgress = (wig) => {
    if (wig.measureType === 'NUMERIC') {
      // WeeklyData에서 최신 데이터 가져오기 (백엔드에서 이미 포함되어 있다고 가정)
      // 실제로는 weeklyDataApi.getByWigId()로 가져와야 함
      return 0; // 임시값
    } else if (wig.measureType === 'STATE') {
      const completed = wig.milestones.filter(m => m.completed).length;
      return ((completed / wig.milestones.length) * 100).toFixed(1);
    }
    return 0;
  };

  // 현재 상태
  const getCurrentStatus = (wig) => {
    if (wig.measureType === 'NUMERIC') {
      return `${wig.fromX} ${wig.unit} → ${wig.toY} ${wig.unit}`;
    } else if (wig.measureType === 'STATE') {
      const completed = wig.milestones.filter(m => m.completed).length;
      return `${completed}/${wig.milestones.length} 마일스톤`;
    }
    return '-';
  };

  const progress = getProgress(selectedWig);
  const completedCommitments = commitments.filter(c => c.completed).length;
  const totalCommitments = commitments.length;
  const commitmentRate = totalCommitments > 0 
    ? ((completedCommitments / totalCommitments) * 100).toFixed(0) 
    : 0;

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

      {/* WIG 헤더 카드 */}
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
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
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
              <p className="text-2xl font-bold text-gray-800">{getCurrentStatus(selectedWig)}</p>
            </div>
            <Target className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">진행률</p>
              <p className="text-2xl font-bold text-gray-800">{progress}%</p>
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

      {/* 마일스톤 진행상황 (STATE 타입만) */}
      {selectedWig.measureType === 'STATE' && selectedWig.milestones && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Award className="mr-2 text-yellow-500" size={24} />
            마일스톤 진행상황
          </h3>
          <div className="space-y-3">
            {selectedWig.milestones.map((milestone, idx) => (
              <div key={milestone.id} className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  milestone.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
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
