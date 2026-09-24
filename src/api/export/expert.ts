import request from '/@/utils/request';

/**
 * 根据分页查询参数获取专家列表数据。
 *
 * @param query 查询参数
 * @returns
 */
export function fetchList(query?: Object) {
	return request({
		url: '/export/expert/page',
		method: 'get',
		params: query,
	});
}

/**
 * 添加一个新专家。
 * @param {Object} [obj] - 要添加的对象。
 * @returns {Promise} 请求的 Promise 对象 （true/false）。
 */
export function addObj(obj?: Object) {
	return request({
		url: '/export/expert',
		method: 'post',
		data: obj,
	});
}

/**
 * 根据查询参数获取专家详情。
 * @param {Object} [obj] - 查询参数。
 * @returns {Promise} 请求的 Promise 对象数组。
 */
export function getObj(obj?: Object) {
	return request({
		url: '/export/expert/details',
		method: 'get',
		params: obj,
	});
}

/**
 * 根据 ID 删除专家。
 * @param {Object} [ids] - 要删除的对象 ID。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function delObjs(ids?: Object) {
	return request({
		url: '/export/expert',
		method: 'delete',
		data: ids,
	});
}

/**
 * 更新一个已存在的专家。
 * @param {Object} [obj] - 要更新的对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function putObj(obj?: Object) {
	return request({
		url: '/export/expert',
		method: 'put',
		data: obj,
	});
}

/**
 * 根据查询参数获取专家列表数据。
 *
 * @param query 查询参数
 * @returns {Promise} 请求的 Promise 对象。
 */
export function getDetails(query?: Object) {
	return request({
		url: '/export/expert/details',
		method: 'get',
		params: query,
	});
}
