import apiClient from './client';

/**
 * Weekly Data (주간 실적) API 서비스
 */
const weeklyDataApi = {
  /**
   * 특정 WIG의 모든 주간 데이터 조회
   * @param {number} wigId - WIG ID
   */
  getByWigId: async (wigId) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/weekly-data`);
    return response.data;
  },

  /**
   * 특정 WIG의 특정 주차 데이터 조회
   * @param {number} wigId - WIG ID
   * @param {string} week - 주차 (예: "W1")
   */
  getByWigIdAndWeek: async (wigId, week) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/weekly-data/${week}`);
    return response.data;
  },

  /**
   * 주간 데이터 생성
   * @param {Object} data - { week, milestoneProgress?, actual?, target?, lead1?, lead2?, wigId }
   */
  create: async (data) => {
    const response = await apiClient.post('/api/weekly-data', data);
    return response.data;
  },

  /**
   * 주간 데이터 수정
   * @param {number} id - Weekly Data ID
   * @param {Object} data - 수정할 데이터
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/api/weekly-data/${id}`, data);
    return response.data;
  },

  /**
   * 주간 데이터 삭제
   * @param {number} id - Weekly Data ID
   */
  delete: async (id) => {
    await apiClient.delete(`/api/weekly-data/${id}`);
  },
};

export default weeklyDataApi;
