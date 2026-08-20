import request from '/@/utils/request';

/**
 * 分页查询：根据查询参数获取公告&媒体新闻列表。
 *
 * @param query 查询参数
 * @returns Promise
 */
export function fetchList(query?: Object) {
	return request({
		url: '/quanta/stockMotAnnNews/page',
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
export function getObj(query?: Object) {
	return request({
		url: '/quanta/stockMotAnnNews/details',
		method: 'get',
		params: query,
	});
}

/**
 * 新增：添加一条公告&媒体新闻。
 * @param {Object} [obj] - 新增的对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function addObj(obj?: Object) {
	return request({
		url: '/quanta/stockMotAnnNews',
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
		url: '/quanta/stockMotAnnNews',
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
		url: '/quanta/stockMotAnnNews',
		method: 'delete',
		data: ids,
	});
}

/**
 * 手动同步：按股票代码同步公告&媒体新闻（东方财富失败自动降级巨潮资讯）。
 *
 * @param query 查询参数（tsCode 必填，full 可选）
 * @returns Promise
 */
export function syncNews(query?: Object) {
	return request({
		url: '/quanta/stockMotAnnNews/sync',
		method: 'post',
		params: query,
	});
}
