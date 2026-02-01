import apiClient from './client';

/**
 * Lead Measure API 서비스
 */
const leadMeasureApi = {
  /**
   * 특정 WIG의 모든 Lead Measures 조회
   * @param {number} wigId - WIG ID
   */
  getByWigId: async (wigId) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/lead-measures`);
    return response.data;
  },

  /**
   * Lead Measure 생성
   * @param {Object} data - { name, dailyTarget, weeklyTarget, unit, wigId }
   */
  create: async (data) => {
    const response = await apiClient.post('/api/lead-measures', data);
    return response.data;
  },

  /**
   * Lead Measure 수정
   * @param {number} id - Lead Measure ID
   * @param {Object} data - 수정할 데이터
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/api/lead-measures/${id}`, data);
    return response.data;
  },

  /**
   * Lead Measure 삭제
   * @param {number} id - Lead Measure ID
   */
  delete: async (id) => {
    await apiClient.delete(`/api/lead-measures/${id}`);
  },
};

export default leadMeasureApi;
