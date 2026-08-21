import request from '/@/utils/request';

/**
 * 分页查询候选股票池。
 *
 * @param query 查询参数
 * @returns Promise
 */
export function fetchList(query?: Object) {
	return request({
		url: '/quanta/stockCandidate/page',
		method: 'get',
		params: query,
	});
}

/**
 * 条件查询候选股票池。
 *
 * @param query 查询参数
 * @returns Promise
 */
export function getDetails(query?: Object) {
	return request({
		url: '/quanta/stockCandidate/details',
		method: 'get',
		params: query,
	});
}

/**
 * 手动刷新候选池（Gate 硬门 + 过期管理）。
 *
 * @param date 信号日 YYYYMMDD，为空取最新交易日
 * @returns Promise
 */
export function refreshCandidates(date?: String) {
	return request({
		url: '/quanta/stockCandidate/refresh',
		method: 'post',
		params: { date },
	});
}
