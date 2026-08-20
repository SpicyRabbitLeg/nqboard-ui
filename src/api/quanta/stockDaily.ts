import request from '/@/utils/request';

/**
 * 分页查询：根据查询参数获取股票日线行情列表。
 *
 * @param query 查询参数
 * @returns Promise
 */
export function fetchList(query?: Object) {
	return request({
		url: '/quanta/stockDaily/page',
		method: 'get',
		params: query,
	});
}

/**
 * 条件查询：根据查询参数获取列表数据。
 *
 * @param query 查询参数
 * @returns Promise
 */
export function getDetails(query?: Object) {
	return request({
		url: '/quanta/stockDaily/details',
		method: 'get',
		params: query,
	});
}

/**
 * 新增：添加一条股票日线行情。
 * @param {Object} [obj] - 新增的对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function addObj(obj?: Object) {
	return request({
		url: '/quanta/stockDaily',
		method: 'post',
		data: obj,
	});
}

/**
 * 修改：更新一个已存在的对象。
 * @param {Object} [obj] - 要更新的对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function putObj(obj?: Object) {
	return request({
		url: '/quanta/stockDaily',
		method: 'put',
		data: obj,
	});
}

/**
 * 删除：根据 ID 删除对象。
 * @param {Object} [ids] - 要删除的对象 ID。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function delObjs(ids?: Object) {
	return request({
		url: '/quanta/stockDaily',
		method: 'delete',
		data: ids,
	});
}

/**
 * K线数据：按股票代码返回最新 limit 根日线（正序），供前端K线图一次拉取后本地翻页。
 *
 * @param query 查询参数（tsCode 必填，limit 可选）
 * @returns Promise
 */
export function fetchKline(query?: Object) {
	return request({
		url: '/quanta/stockDaily/kline',
		method: 'get',
		params: query,
	});
}
