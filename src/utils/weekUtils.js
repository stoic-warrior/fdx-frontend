/**
 * 주차 계산 유틸리티
 * Scoreboard, Dashboard, Commitments에서 공통 사용
 * 한 주의 시작: 월요일, 끝: 일요일
 */

// 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD)
export const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * 주어진 날짜가 속한 주의 월요일을 반환
 * @param {Date} date
 * @returns {Date} 해당 주의 월요일
 */
export const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=일, 1=월, ..., 6=토
    const diff = day === 0 ? -6 : 1 - day; // 일요일이면 -6, 그 외 1-day
    d.setDate(d.getDate() + diff);
    return d;
};

/**
 * WIG 기간에 따른 동적 주차 목록 계산
 * W1은 WIG 생성일이 속한 주의 월요일부터 시작
 * @param {Object} wig - WIG 객체 (createdAt, byWhen 필요)
 * @returns {string[]} - ['W1', 'W2', ...] 형태의 주차 배열
 */
export const calculateWeeks = (wig) => {
    if (!wig) return ['W1'];

    const wigCreatedDate = wig.createdAt?.split('T')[0] || '2020-01-01';
    const startMonday = getMonday(new Date(wigCreatedDate));
    const endDate = wig.byWhen ? new Date(wig.byWhen) : new Date();
    const today = new Date(getLocalToday());

    // 목표일과 오늘 중 더 늦은 날짜까지 주차 생성
    const finalDate = new Date(Math.max(endDate, today));

    const diffTime = finalDate - startMonday;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const totalWeeks = Math.max(1, Math.floor(diffDays / 7) + 1);

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
    const startMonday = getMonday(new Date(wigCreatedDate));
    const today = new Date(getLocalToday());
    const diffTime = today - startMonday;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const currentWeekNum = Math.max(1, Math.floor(diffDays / 7) + 1);
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