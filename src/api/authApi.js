import apiClient from './client';

/**
 * 인증 관련 API 서비스
 */
const authApi = {
    /**
     * 로그인
     * @param {string} email - 이메일
     * @param {string} password - 비밀번호
     * @returns {Promise<{accessToken: string, tokenType: string, expiresIn: number}>}
     */
    login: async (email, password) => {
        const response = await apiClient.post('/api/auth/login', { email, password });
        return response.data;
    },

    /**
     * 회원가입
     * @param {Object} data - { email, password, name }
     */
    register: async (data) => {
        const response = await apiClient.post('/api/auth/signup', data);
        return response.data;
    },

    /**
     * 토큰 저장
     * @param {string} token - JWT 토큰
     */
    saveToken: (token) => {
        localStorage.setItem('accessToken', token);
    },

    /**
     * 토큰 조회
     * @returns {string|null}
     */
    getToken: () => {
        return localStorage.getItem('accessToken');
    },

    /**
     * 토큰 삭제 (로그아웃)
     */
    removeToken: () => {
        localStorage.removeItem('accessToken');
    },

    /**
     * 로그인 여부 확인
     * @returns {boolean}
     */
    isLoggedIn: () => {
        return !!localStorage.getItem('accessToken');
    },
};

export default authApi;