import request from '/@/utils/request';

/**
 * 命中率汇总（近 N 个信号日）。
 *
 * @param days 回看信号日数
 * @returns Promise
 */
export function fetchSummary(days?: Number) {
	return request({
		url: '/quanta/stockCandidateHit/summary',
		method: 'get',
		params: { days },
	});
}

/**
 * 指定信号日的候选命中明细。
 *
 * @param date 信号日 YYYYMMDD
 * @returns Promise
 */
export function fetchDaily(date: String) {
	return request({
		url: '/quanta/stockCandidateHit/daily',
		method: 'get',
		params: { date },
	});
}

/**
 * 手动刷新命中率追踪（幂等）。
 *
 * @returns Promise
 */
export function refreshHits() {
	return request({
		url: '/quanta/stockCandidateHit/refresh',
		method: 'post',
	});
}
