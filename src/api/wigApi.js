import apiClient from './client';

/**
 * WIG API 서비스
 */
const wigApi = {
  /**
   * 모든 WIG 조회
   */
  getAll: async () => {
    const response = await apiClient.get('/api/wigs');
    return response.data;
  },

  /**
   * WIG 개수 조회
   */
  getCount: async () => {
    const response = await apiClient.get('/api/wigs/count');
    return response.data;
  },

  /**
   * WIG 생성
   * @param {Object} wigData - { title, fromX, toY, byWhen, measureType, unit? }
   */
  create: async (wigData) => {
    const response = await apiClient.post('/api/wigs', wigData);
    return response.data;
  },

  /**
   * WIG 수정
   * @param {number} id - WIG ID
   * @param {Object} wigData - 수정할 데이터
   */
  update: async (id, wigData) => {
    const response = await apiClient.put(`/api/wigs/${id}`, wigData);
    return response.data;
  },

  /**
   * WIG 삭제
   * @param {number} id - WIG ID
   */
  delete: async (id) => {
    await apiClient.delete(`/api/wigs/${id}`);
  },
};

export default wigApi;
