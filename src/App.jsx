import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckSquare, Calendar } from 'lucide-react';
import wigApi from './api/wigApi';
import Dashboard from './components/Dashboard';
import Scoreboard from './components/Scoreboard';
import Commitments from './components/Commitments';
import WIGManagement from './components/WIGManagement';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wigs, setWigs] = useState([]);
  const [selectedWigId, setSelectedWigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WIG 데이터 로드
  const loadWigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wigApi.getAll();
      setWigs(data);
      
      // 첫 번째 WIG을 기본 선택
      if (data.length > 0 && !selectedWigId) {
        setSelectedWigId(data[0].id);
      }
    } catch (err) {
      console.error('WIG 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 WIG 로드
  useEffect(() => {
    loadWigs();
  }, []);

  // WIG 추가/삭제 시 재로드
  const handleWigChange = () => {
    loadWigs();
  };

  // 선택된 WIG
  const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={loadWigs}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // WIG이 없을 때
  if (wigs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">WIG Tracker</h1>
              <p className="text-sm text-gray-600">4 Disciplines of Execution</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <Target className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">WIG이 없습니다</h2>
            <p className="text-gray-600 mb-6">첫 번째 목표를 만들어보세요!</p>
            <button
              onClick={() => setActiveTab('wigs')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              WIG 만들기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">WIG Tracker</h1>
            <p className="text-sm text-gray-600">4 Disciplines of Execution</p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            {[
              { id: 'dashboard', label: '대시보드', icon: Target },
              { id: 'scoreboard', label: '스코어보드', icon: TrendingUp },
              { id: 'commitments', label: '주간 약속', icon: CheckSquare },
              { id: 'wigs', label: 'WIG 관리', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div>
          {activeTab === 'dashboard' && (
            <Dashboard
              wigs={wigs}
              selectedWigId={selectedWigId}
              onSelectWig={setSelectedWigId}
            />
          )}
          {activeTab === 'scoreboard' && (
            <Scoreboard
              wigs={wigs}
              selectedWigId={selectedWigId}
              onSelectWig={setSelectedWigId}
            />
          )}
          {activeTab === 'commitments' && (
            <Commitments
              wigs={wigs}
              selectedWigId={selectedWigId}
              onSelectWig={setSelectedWigId}
            />
          )}
          {activeTab === 'wigs' && (
            <WIGManagement
              wigs={wigs}
              onWigChange={handleWigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
