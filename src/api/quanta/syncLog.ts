import request from '/@/utils/request';

/**
 * 分页查询同步日志：按运行日期区间与任务类型过滤，按开始时间倒序。
 *
 * @param query 查询参数（syncType / startDate / endDate，YYYYMMDD）
 * @returns Promise
 */
export function fetchList(query?: Object) {
	return request({
		url: '/quanta/syncLog/page',
		method: 'get',
		params: query,
	});
}

/**
 * 查询指定日期各同步任务最新执行状态（默认今天）。
 *
 * @param runDate 运行日期 YYYYMMDD，为空取今天
 * @returns Promise
 */
export function fetchLatest(runDate?: String) {
	return request({
		url: '/quanta/syncLog/latest',
		method: 'get',
		params: { runDate },
	});
}
