import apiClient from './client';

/**
 * Milestone API 서비스 (STATE 타입 WIG 전용)
 */
const milestoneApi = {
  /**
   * 특정 WIG의 모든 Milestones 조회
   * @param {number} wigId - WIG ID
   */
  getByWigId: async (wigId) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/milestones`);
    return response.data;
  },

  /**
   * Milestone 진행률 조회
   * @param {number} wigId - WIG ID
   * @returns {Object} { total, completed, progressRate }
   */
  getProgress: async (wigId) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/milestones/progress`);
    return response.data;
  },

  /**
   * Milestone 생성
   * @param {Object} data - { name, completed?, orderIndex, wigId }
   */
  create: async (data) => {
    const response = await apiClient.post('/api/milestones', data);
    return response.data;
  },

  /**
   * Milestone 수정
   * @param {number} id - Milestone ID
   * @param {Object} data - 수정할 데이터
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/api/milestones/${id}`, data);
    return response.data;
  },

  /**
   * Milestone 완료 상태 토글
   * @param {number} id - Milestone ID
   */
  toggleCompleted: async (id) => {
    const response = await apiClient.patch(`/api/milestones/${id}/toggle`);
    return response.data;
  },

  /**
   * Milestone 삭제
   * @param {number} id - Milestone ID
   */
  delete: async (id) => {
    await apiClient.delete(`/api/milestones/${id}`);
  },
};

export default milestoneApi;
