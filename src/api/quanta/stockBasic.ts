import request from '/@/utils/request';

/**
 * 分页查询：根据查询参数获取股票基础信息列表。
 *
 * @param query 查询参数
 * @returns Promise
 */
export function fetchList(query?: Object) {
	return request({
		url: '/quanta/stockBasic/page',
		method: 'get',
		params: query,
	});
}

/**
 * 新增：添加一条股票基础信息。
 * @param {Object} [obj] - 新增的对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function addObj(obj?: Object) {
	return request({
		url: '/quanta/stockBasic',
		method: 'post',
		data: obj,
	});
}

/**
 * 条件查询：根据查询参数获取对象详情。
 * @param {Object} [obj] - 查询参数。
 * @returns {Promise} 请求的 Promise 对象数组。
 */
export function getObj(obj?: Object) {
	return request({
		url: '/quanta/stockBasic/details',
		method: 'get',
		params: obj,
	});
}

/**
 * 删除：根据 ID 删除对象。
 * @param {Object} [ids] - 要删除的对象 ID。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function delObjs(ids?: Object) {
	return request({
		url: '/quanta/stockBasic',
		method: 'delete',
		data: ids,
	});
}

/**
 * 修改：更新一个已存在的对象。
 * @param {Object} [obj] - 要更新的对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function putObj(obj?: Object) {
	return request({
		url: '/quanta/stockBasic',
		method: 'put',
		data: obj,
	});
}

/**
 * 条件查询：根据查询参数获取列表数据。
 *
 * @param query 查询参数
 * @returns {Promise} 请求的 Promise 对象。
 */
export function getDetails(query?: Object) {
	return request({
		url: '/quanta/stockBasic/details',
		method: 'get',
		params: query,
	});
}

/**
 * 字段唯一性校验（如 ts_code）。
 *
 * 示例用法：
 * 字段名: [{ validator: (rule, value, callback) => { validateExist(rule, value, callback, form.id !== ''); }, trigger: 'blur' }]
 */
export function validateExist(rule: any, value: any, callback: any, isEdit: boolean) {
	if (isEdit) {
		return callback();
	}
	getObj({ [rule.field]: value }).then((response: any) => {
		const result = response.data;
		if (result !== null && result.length > 0) {
			callback(new Error('数据已经存在'));
		} else {
			callback();
		}
	});
}

/**
 * 股票下拉选项分页查询：keyword 按代码/名称模糊匹配（可空），current/size 分页。
 * 前端 remote 搜索 + 滚动到底自动加载下一页。
 *
 * @param query 查询参数（keyword/current/size）
 * @returns Promise
 */
export function fetchOptions(query?: Object) {
	return request({
		url: '/quanta/stockBasic/options',
		method: 'get',
		params: query,
	});
}
