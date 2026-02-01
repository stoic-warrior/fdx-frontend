import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckSquare, Calendar, LogOut, User } from 'lucide-react';
import wigApi from './api/wigApi';
import authApi from './api/authApi';
import Dashboard from './components/Dashboard';
import Scoreboard from './components/Scoreboard';
import Commitments from './components/Commitments';
import WIGManagement from './components/WIGManagement';
import LoginPage from './components/LoginPage';

const App = () => {
    // 인증 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // 앱 상태
    const [activeTab, setActiveTab] = useState('dashboard');
    const [wigs, setWigs] = useState([]);
    const [selectedWigId, setSelectedWigId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 초기 인증 상태 확인
    useEffect(() => {
        const token = authApi.getToken();
        setIsAuthenticated(!!token);
        setAuthChecked(true);
    }, []);

    // WIG 데이터 로드 (인증된 경우에만)
    const loadWigs = async () => {
        if (!isAuthenticated) return;

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

    // 인증 상태 변경 시 WIG 로드
    useEffect(() => {
        if (isAuthenticated) {
            loadWigs();
        }
    }, [isAuthenticated]);

    // 로그인 성공 핸들러
    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    // 로그아웃 핸들러
    const handleLogout = () => {
        authApi.removeToken();
        setIsAuthenticated(false);
        setWigs([]);
        setSelectedWigId(null);
    };

    // WIG 추가/삭제 시 재로드
    const handleWigChange = () => {
        loadWigs();
    };

    // 선택된 WIG
    const selectedWig = wigs.find(w => w.id === selectedWigId) || wigs[0];

    // 인증 확인 전 로딩
    if (!authChecked) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">초기화 중...</p>
                </div>
            </div>
        );
    }

    // 로그인 페이지
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

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
                    <div className="space-y-2">
                        <button
                            onClick={loadWigs}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            로그아웃
                        </button>
                    </div>
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
                            <div className="flex items-center space-x-4">
                                <p className="text-sm text-gray-600">4 Disciplines of Execution</p>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} className="mr-1" />
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <Target className="mx-auto mb-4 text-gray-400" size={64} />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">WIG이 없습니다</h2>
                        <p className="text-gray-600 mb-6">첫 번째 목표를 추가해보세요!</p>
                        <button
                            onClick={() => setActiveTab('management')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            WIG 추가하기
                        </button>
                    </div>
                </div>

                {activeTab === 'management' && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                        <WIGManagement wigs={wigs} onWigChange={handleWigChange} />
                    </div>
                )}
            </div>
        );
    }

    // 메인 UI
    return (
        <div className="min-h-screen bg-gray-100">
            {/* 헤더 */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-2xl font-bold text-gray-900">WIG Tracker</h1>

                        {/* WIG 선택 + 로그아웃 */}
                        <div className="flex items-center space-x-4">
                            {wigs.length > 1 && (
                                <select
                                    value={selectedWigId || ''}
                                    onChange={(e) => setSelectedWigId(Number(e.target.value))}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                >
                                    {wigs.map(wig => (
                                        <option key={wig.id} value={wig.id}>
                                            {wig.title}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <button
                                onClick={handleLogout}
                                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="로그아웃"
                            >
                                <LogOut size={16} className="mr-1" />
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'dashboard', icon: Target, label: '대시보드' },
                            { id: 'scoreboard', icon: TrendingUp, label: '스코어보드' },
                            { id: 'commitments', icon: CheckSquare, label: '주간 약속' },
                            { id: 'management', icon: Calendar, label: 'WIG 관리' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon className="mr-2" size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {activeTab === 'dashboard' && selectedWig && (
                    <Dashboard wig={selectedWig} onDataChange={handleWigChange} />
                )}
                {activeTab === 'scoreboard' && selectedWig && (
                    <Scoreboard wig={selectedWig} />
                )}
                {activeTab === 'commitments' && selectedWig && (
                    <Commitments wig={selectedWig} onDataChange={handleWigChange} />
                )}
                {activeTab === 'management' && (
                    <WIGManagement wigs={wigs} onWigChange={handleWigChange} />
                )}
            </div>
        </div>
    );
};

export default App;