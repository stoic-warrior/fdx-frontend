import axios from 'axios';

// API 기본 URL (환경변수 또는 기본값)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 (로깅)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error);
    
    if (error.response) {
      // 서버가 응답했지만 에러 상태 코드
      const { status, data } = error.response;
      console.error(`Status: ${status}`, data);
      
      // 사용자에게 보여줄 에러 메시지
      const errorMessage = data?.message || data?.error || '알 수 없는 오류가 발생했습니다.';
      return Promise.reject(new Error(errorMessage));
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
