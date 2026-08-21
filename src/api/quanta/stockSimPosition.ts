import request from '/@/utils/request';

/**
 * 分页查询模拟持仓。
 *
 * @param query 查询参数
 * @returns Promise
 */
export function fetchList(query?: Object) {
	return request({
		url: '/quanta/stockSimPosition/page',
		method: 'get',
		params: query,
	});
}

/**
 * 持仓详情。
 *
 * @param id 持仓id
 * @returns Promise
 */
export function getDetails(id: String | Number) {
	return request({
		url: '/quanta/stockSimPosition/details',
		method: 'get',
		params: { id },
	});
}

/**
 * 模拟买入（创建计划委托，次日开盘价成交）。
 *
 * @param candidateId 候选记录id
 * @returns Promise
 */
export function buyPosition(candidateId: String | Number) {
	return request({
		url: '/quanta/stockSimPosition/buy',
		method: 'post',
		params: { candidateId },
	});
}

/**
 * 持仓逐日盯市记录。
 *
 * @param positionId 持仓id
 * @returns Promise
 */
export function fetchDaily(positionId: String | Number) {
	return request({
		url: '/quanta/stockSimPosition/daily',
		method: 'get',
		params: { positionId },
	});
}

/**
 * 持仓总览（活跃持仓数/已实现盈亏）。
 *
 * @returns Promise
 */
export function fetchOverview() {
	return request({
		url: '/quanta/stockSimPosition/overview',
		method: 'get',
	});
}

/**
 * 手动触发持仓跟踪（买入成交/离场评估/逐日盯市）。
 *
 * @param date 交易日 YYYYMMDD，为空取最新交易日
 * @returns Promise
 */
export function trackPositions(date?: String) {
	return request({
		url: '/quanta/stockSimPosition/track',
		method: 'post',
		params: { date },
	});
}
