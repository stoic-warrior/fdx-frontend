import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import authApi from '../api/authApi';

// 백엔드 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// OAuth 전용 URL (프록시 불가, 직접 연결 필요)
const OAUTH_BASE_URL = 'http://3.27.147.163.nip.io:8080';

/**
 * 로그인/회원가입 페이지
 * 일반 로그인 + OAuth (Google, Kakao, Naver)
 */
const LoginPage = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });

    // ⭐ OAuth 로그인 URL
    const handleOAuthLogin = (provider) => {
        const url = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`;
        console.log('OAuth URL:', url);
        window.location.href = url;
    };

    // 일반 로그인/회원가입
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const response = await authApi.login({
                    email: formData.email,
                    password: formData.password
                });
                localStorage.setItem('token', response.accessToken);
                localStorage.setItem('user', JSON.stringify({
                    email: response.email,
                    name: response.name,
                    provider: 'LOCAL'
                }));
                onLoginSuccess(response);
            } else {
                await authApi.signup(formData);
                setIsLogin(true);
                setError('');
                alert('회원가입 성공! 로그인해주세요.');
            }
        } catch (err) {
            setError(err.message || '처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-md w-full">
                {/* 로고 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-indigo-600">4DX</h1>
                    <p className="text-gray-500 mt-2">목표를 달성하는 실행 시스템</p>
                </div>

                {/* 폼 카드 */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-center mb-6">
                        {isLogin ? '로그인' : '회원가입'}
                    </h2>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* ⭐ 소셜 로그인 버튼 */}
                    <div className="space-y-3 mb-6">
                        {/* Google */}
                        <button
                            onClick={() => handleOAuthLogin('google')}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-gray-700 font-medium">Google로 계속하기</span>
                        </button>

                        {/* Kakao */}
                        <button
                            onClick={() => handleOAuthLogin('kakao')}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#FEE500] rounded-lg hover:bg-[#FDD800] transition"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                            </svg>
                            <span className="text-gray-900 font-medium">카카오로 계속하기</span>
                        </button>

                        {/* Naver */}
                        <button
                            onClick={() => handleOAuthLogin('naver')}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#03C75A] rounded-lg hover:bg-[#02b351] transition"
                        >
                            <span className="text-white font-bold text-lg">N</span>
                            <span className="text-white font-medium">네이버로 계속하기</span>
                        </button>
                    </div>

                    {/* 구분선 */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">또는 이메일로</span>
                        </div>
                    </div>

                    {/* 일반 로그인 폼 */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 이름 (회원가입 시만) */}
                        {!isLogin && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="이름"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}

                        {/* 이메일 */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="이메일"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* 비밀번호 */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="비밀번호"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* 제출 버튼 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
                        </button>
                    </form>

                    {/* 로그인/회원가입 전환 */}
                    <p className="text-center mt-6 text-gray-600">
                        {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="ml-2 text-indigo-600 font-medium hover:underline"
                        >
                            {isLogin ? '회원가입' : '로그인'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;