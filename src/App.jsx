import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckSquare, Calendar, LogOut } from 'lucide-react';
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
    const [expandedWigId, setExpandedWigId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 사용자 정보 (OAuth 프로필 이미지 등)
    const [user, setUser] = useState(null);

    // Dashboard 새로고침용 키
    const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

    // ⭐ OAuth 콜백 처리 + 초기 인증 상태 확인
    useEffect(() => {
        // OAuth 콜백 체크 (URL에 token 파라미터 있는지)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            // OAuth 로그인 성공 - 토큰 저장
            localStorage.setItem('accessToken', token);

            // URL에서 사용자 정보도 가져오기
            const email = params.get('email');
            const name = decodeURIComponent(params.get('name') || '');
            const provider = params.get('provider');
            const profileImageUrl = params.get('profileImageUrl')
                ? decodeURIComponent(params.get('profileImageUrl'))
                : null;

            const userData = { email, name, provider, profileImageUrl };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            // URL 파라미터 제거 (깔끔하게)
            window.history.replaceState({}, document.title, '/');

            setIsAuthenticated(true);
            setAuthChecked(true);
            return;
        }

        // 일반 토큰 체크
        const savedToken = authApi.getToken();
        const savedUser = localStorage.getItem('user');

        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }

        setIsAuthenticated(!!savedToken);
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

            // 첫 번째 WIG를 기본 선택
            if (data.length > 0 && !selectedWigId) {
                setSelectedWigId(data[0].id);
            }
            return data;
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
    const handleLoginSuccess = (response) => {
        // 일반 로그인 시 사용자 정보 저장
        if (response) {
            const userData = {
                email: response.email,
                name: response.name,
                provider: response.provider || 'LOCAL',
                profileImageUrl: response.profileImageUrl || null
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        }
        setIsAuthenticated(true);
    };

    // 로그아웃 핸들러
    const handleLogout = () => {
        authApi.removeToken();
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        setWigs([]);
        setSelectedWigId(null);
    };

    // WIG 추가/삭제 시 재로드
    const handleWigChange = async () => {
        return await loadWigs();
    };

    // 오늘 데이터 변경 시 Dashboard 새로고침
    const handleTodayDataChange = () => {
        setDashboardRefreshKey(prev => prev + 1);
    };

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

    // ⭐ 헤더 컴포넌트 (프로필 이미지 포함)
    const Header = () => (
        <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4 min-w-0">
                    <div className="flex items-center space-x-3 min-w-0 shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">WIG Tracker</h1>
                        <p className="text-sm text-gray-600 hidden lg:block">4 Disciplines of Execution</p>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
                        {/* 사용자 프로필 */}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {user?.profileImageUrl ? (
                                <img
                                    src={user.profileImageUrl}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-700 hidden md:block">
                                {user?.name || '사용자'}
                            </span>
                            {user?.provider && user.provider !== 'LOCAL' && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full hidden md:block">
                                    {user.provider}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center px-2 sm:px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                        >
                            <LogOut size={16} className="sm:mr-1" />
                            <span className="hidden sm:inline">로그아웃</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // WIG이 없을 때
    if (wigs.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <WIGManagement
                        wigs={wigs}
                        onWigChange={handleWigChange}
                        autoShowForm={true}
                        expandedWigId={expandedWigId}
                        setExpandedWigId={setExpandedWigId}
                    />
                </div>
            </div>
        );
    }

    // 메인 UI
    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            {/* 메인 컨텐츠 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 탭 네비게이션 */}
                <div className="mb-6">
                    <div className="flex overflow-x-auto border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                        {[
                            { id: 'dashboard', label: '대시보드', icon: Target },
                            { id: 'scoreboard', label: '스코어보드', icon: TrendingUp },
                            { id: 'commitments', label: '주간 약속', icon: CheckSquare },
                            { id: 'wigs', label: 'WIG 관리', icon: Calendar }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap shrink-0 ${
                                    activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <tab.icon size={18} className="sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">{tab.label}</span>
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
                            onWigChange={handleWigChange}
                            refreshKey={dashboardRefreshKey}
                        />
                    )}
                    {activeTab === 'scoreboard' && (
                        <Scoreboard
                            wigs={wigs}
                            selectedWigId={selectedWigId}
                            onSelectWig={setSelectedWigId}
                            onTodayDataChange={handleTodayDataChange}
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
                            expandedWigId={expandedWigId}
                            setExpandedWigId={setExpandedWigId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;