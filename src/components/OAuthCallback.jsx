import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * OAuth 로그인 콜백 페이지
 * /oauth/callback?token=xxx&email=xxx&name=xxx&provider=xxx&profileImageUrl=xxx
 */
const OAuthCallback = ({ onLoginSuccess }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const provider = searchParams.get('provider');
        const profileImageUrl = searchParams.get('profileImageUrl');

        if (token) {
            // 토큰 저장
            localStorage.setItem('token', token);

            // 사용자 정보 저장 (프로필 이미지 포함)
            const user = {
                email,
                name,
                provider,
                profileImageUrl: profileImageUrl || null
            };
            localStorage.setItem('user', JSON.stringify(user));

            console.log(`OAuth 로그인 성공: ${provider} - ${email}`);

            // 로그인 성공 콜백 호출
            if (onLoginSuccess) {
                onLoginSuccess(user);
            }

            // 메인 페이지로 이동
            navigate('/', { replace: true });
        } else {
            // 토큰이 없으면 로그인 페이지로
            console.error('OAuth 로그인 실패: 토큰 없음');
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate, onLoginSuccess]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-600">로그인 처리 중...</p>
            </div>
        </div>
    );
};

export default OAuthCallback;