import axios from 'axios';

// API 기본 URL (환경변수 또는 기본값)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


// Axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 (토큰 자동 첨부 + 로깅)
apiClient.interceptors.request.use(
    (config) => {
        // localStorage에서 토큰 가져와서 헤더에 추가
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 (에러 처리 + 401 시 로그아웃)
apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error);

        if (error.response) {
            const { status, data } = error.response;
            console.error(`Status: ${status}`, data);

            // 401 Unauthorized - 토큰 만료 또는 인증 실패
            if (status === 401) {
                // 토큰 삭제
                localStorage.removeItem('accessToken');

                // 로그인 페이지가 아닌 경우에만 리다이렉트
                // (로그인 시도 중 401은 리다이렉트하면 안 됨)
                if (!error.config.url.includes('/api/auth/')) {
                    // 페이지 새로고침으로 App.jsx의 인증 체크 트리거
                    window.location.reload();
                }
            }

            // 사용자에게 보여줄 에러 메시지
            return Promise.reject(error);
        } else if (error.request) {
            // 요청은 보냈지만 응답을 받지 못함
            console.error('No response received:', error.request);
            return Promise.reject(new Error('서버와 통신할 수 없습니다. 백엔드가 실행 중인지 확인하세요.'));
        } else {
            // 요청 설정 중 에러
            console.error('Request setup error:', error.message);
            return Promise.reject(error);
        }
    }
);

export default apiClient;