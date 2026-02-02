import React, { useState } from 'react';
import { LogIn, UserPlus, Target, AlertCircle } from 'lucide-react';
import authApi from '../api/authApi';

const LoginPage = ({ onLoginSuccess }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLoginMode) {
                // 로그인
                const response = await authApi.login(email, password);
                authApi.saveToken(response.accessToken);
                onLoginSuccess();
            } else {
                // 회원가입
                await authApi.register({ email, password, name: username });
                // 회원가입 성공 후 자동 로그인
                const loginResponse = await authApi.login(email, password);
                authApi.saveToken(loginResponse.accessToken);
                onLoginSuccess();
            }
        } catch (err) {
            console.error('인증 실패:', err);
            setError(err.message || '인증에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fillTestAccount = () => {
        setEmail('test@example.com');
        setPassword('password123');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white text-center">
                    <Target className="mx-auto mb-3" size={48} />
                    <h1 className="text-2xl font-bold">WIG Tracker</h1>
                    <p className="text-blue-100 text-sm mt-1">4 Disciplines of Execution</p>
                </div>

                {/* 폼 */}
                <div className="p-8">
                    <div className="flex mb-6">
                        <button
                            onClick={() => { setIsLoginMode(true); setError(null); }}
                            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                                isLoginMode
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <LogIn className="inline mr-2" size={18} />
                            로그인
                        </button>
                        <button
                            onClick={() => { setIsLoginMode(false); setError(null); }}
                            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                                !isLoginMode
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <UserPlus className="inline mr-2" size={18} />
                            회원가입
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                            <AlertCircle className="mr-2 flex-shrink-0" size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoginMode && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    이름
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="홍길동"
                                    required={!isLoginMode}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                이메일
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                                loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </span>
                            ) : (
                                isLoginMode ? '로그인' : '회원가입'
                            )}
                        </button>
                    </form>

                    {/* 테스트 계정 안내 */}
                    {isLoginMode && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">🧪 테스트 계정:</p>
                            <div className="text-xs text-gray-500 space-y-1">
                                <p>이메일: test@example.com</p>
                                <p>비밀번호: password123</p>
                            </div>
                            <button
                                type="button"
                                onClick={fillTestAccount}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                                테스트 계정으로 채우기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;