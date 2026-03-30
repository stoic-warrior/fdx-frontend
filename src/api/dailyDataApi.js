import apiClient from './client';

/**
 * Daily Data (일간 실적) API 서비스
 */
const dailyDataApi = {
  /**
   * 특정 WIG의 모든 일간 데이터 조회
   * @param {number} wigId - WIG ID
   */
  getByWigId: async (wigId) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/daily-data`);
    return response.data;
  },

  /**
   * 특정 WIG의 특정 주차 일간 데이터 조회
   * @param {number} wigId - WIG ID
   * @param {string} week - 주차 (예: "W1")
   */
  getByWigIdAndWeek: async (wigId, week) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/daily-data/week/${week}`);
    return response.data;
  },

  /**
   * 특정 WIG의 날짜 범위 일간 데이터 조회
   * @param {number} wigId - WIG ID
   * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
   * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
   */
  getByDateRange: async (wigId, startDate, endDate) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/daily-data/range`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  /**
   * 일간 데이터 생성
   * @param {Object} data - { date, week, dayOfWeek?, lead1?, lead2?, wigId }
   */
  create: async (data) => {
    const response = await apiClient.post('/api/daily-data', data);
    return response.data;
  },

  /**
   * 일간 데이터 수정
   * @param {number} id - Daily Data ID
   * @param {Object} data - 수정할 데이터
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/api/daily-data/${id}`, data);
    return response.data;
  },

  /**
   * 일간 데이터 삭제
   * @param {number} id - Daily Data ID
   */
  delete: async (id) => {
    await apiClient.delete(`/api/daily-data/${id}`);
  },

  /**
   * 특정 WIG의 연속달성 streak 조회
   * @param {number} wigId - WIG ID
   */
  getStreak: async (wigId) => {
    const response = await apiClient.get(`/api/wigs/${wigId}/streak`);
    return response.data;
  },

};

export default dailyDataApi;
