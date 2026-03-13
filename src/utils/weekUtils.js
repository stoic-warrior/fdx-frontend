/**
 * 주차 계산 유틸리티
 * Scoreboard, Dashboard, Commitments에서 공통 사용
 */

// 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD)
export const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * WIG 기간에 따른 동적 주차 목록 계산
 * @param {Object} wig - WIG 객체 (createdAt, byWhen 필요)
 * @returns {string[]} - ['W1', 'W2', ...] 형태의 주차 배열
 */
export const calculateWeeks = (wig) => {
    if (!wig) return ['W1'];

    const wigCreatedDate = wig.createdAt?.split('T')[0] || '2020-01-01';
    const startDate = new Date(wigCreatedDate);
    const endDate = wig.byWhen ? new Date(wig.byWhen) : new Date();
    const today = new Date(getLocalToday());

    // 목표일과 오늘 중 더 늦은 날짜까지 주차 생성
    const finalDate = new Date(Math.max(endDate, today));

    const diffTime = finalDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.max(1, Math.ceil(diffDays / 7));

    return Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);
};

/**
 * 현재 주차 계산 (오늘 기준)
 * @param {Object} wig - WIG 객체
 * @returns {string} - 'W3' 형태의 현재 주차
 */
export const getCurrentWeek = (wig) => {
    if (!wig) return 'W1';

    const wigCreatedDate = wig.createdAt?.split('T')[0] || '2020-01-01';
    const startDate = new Date(wigCreatedDate);
    const today = new Date(getLocalToday());
    const diffTime = today - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekNum = Math.max(1, Math.ceil(diffDays / 7));
    const currentWeek = `W${currentWeekNum}`;

    const weeks = calculateWeeks(wig);
    return weeks.includes(currentWeek) ? currentWeek : weeks[weeks.length - 1];
};

/**
 * 이전 주차 계산
 * @param {string} week - 현재 주차 (예: 'W3')
 * @returns {string|null} - 이전 주차 (예: 'W2'), W1이면 null
 */
export const getPreviousWeek = (week) => {
    const weekNum = parseInt(week.replace('W', ''));
    if (weekNum <= 1) return null;
    return `W${weekNum - 1}`;
};