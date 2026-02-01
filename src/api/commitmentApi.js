import apiClient from './client';

/**
 * Commitment (주간 약속) API 서비스
 */
const commitmentApi = {
  /**
   * 특정 WIG의 모든 Commitments 조회
   * @param {number} wigId - WIG ID
   */
  getByWigId: async (wigId) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/commitments`);
    return response.data;
  },

  /**
   * 특정 WIG의 특정 주차 Commitments 조회
   * @param {number} wigId - WIG ID
   * @param {string} week - 주차 (예: "W1", "W5")
   */
  getByWigIdAndWeek: async (wigId, week) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/commitments/week/${week}`);
    return response.data;
  },

  /**
   * 특정 주차 이행률 조회
   * @param {number} wigId - WIG ID
   * @param {string} week - 주차
   * @returns {Object} { wigId, week, total, completed, completionRate }
   */
  getCompletionRate: async (wigId, week) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/commitments/week/${week}/rate`);
    return response.data;
  },

  /**
   * Commitment 생성
   * @param {Object} data - { text, week, completed?, wigId }
   */
  create: async (data) => {
    const response = await apiClient.post('/api/commitments', data);
    return response.data;
  },

  /**
   * Commitment 수정
   * @param {number} id - Commitment ID
   * @param {Object} data - 수정할 데이터
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/api/commitments/${id}`, data);
    return response.data;
  },

  /**
   * Commitment 완료 상태 토글
   * @param {number} id - Commitment ID
   */
  toggleCompleted: async (id) => {
    const response = await apiClient.patch(`/api/commitments/${id}/toggle`);
    return response.data;
  },

  /**
   * Commitment 삭제
   * @param {number} id - Commitment ID
   */
  delete: async (id) => {
    await apiClient.delete(`/api/commitments/${id}`);
  },
};

export default commitmentApi;
