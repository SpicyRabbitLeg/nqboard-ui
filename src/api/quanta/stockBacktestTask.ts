import request from '/@/utils/request';

/**
 * 创建回测任务并异步执行。
 *
 * @param params 回测参数（为空取默认值）
 * @returns Promise
 */
export function createTask(params?: Object) {
	return request({
		url: '/quanta/stockBacktestTask',
		method: 'post',
		data: params,
	});
}

/**
 * 重跑指定任务。
 *
 * @param taskId 任务id
 * @returns Promise
 */
export function rerunTask(taskId: String | Number) {
	return request({
		url: '/quanta/stockBacktestTask/rerun',
		method: 'post',
		params: { taskId },
	});
}

/**
 * 分页查询任务列表。
 *
 * @param query 分页参数
 * @returns Promise
 */
export function fetchList(query?: Object) {
	return request({
		url: '/quanta/stockBacktestTask/page',
		method: 'get',
		params: query,
	});
}

/**
 * 任务详情。
 *
 * @param taskId 任务id
 * @returns Promise
 */
export function getDetails(taskId: String | Number) {
	return request({
		url: '/quanta/stockBacktestTask/details',
		method: 'get',
		params: { taskId },
	});
}

/**
 * 任务成交明细分页。
 *
 * @param query 查询参数（taskId 必填）
 * @returns Promise
 */
export function fetchTrades(query?: Object) {
	return request({
		url: '/quanta/stockBacktestTask/trades',
		method: 'get',
		params: query,
	});
}

/**
 * 任务统计结果（解析后的 JSON）。
 *
 * @param taskId 任务id
 * @returns Promise
 */
export function fetchStats(taskId: String | Number) {
	return request({
		url: '/quanta/stockBacktestTask/stats',
		method: 'get',
		params: { taskId },
	});
}

/**
 * 任务权益曲线。
 *
 * @param taskId 任务id
 * @returns Promise
 */
export function fetchEquityCurve(taskId: String | Number) {
	return request({
		url: '/quanta/stockBacktestTask/equityCurve',
		method: 'get',
		params: { taskId },
	});
}
