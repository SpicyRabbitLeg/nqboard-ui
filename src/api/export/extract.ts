import request from '/@/utils/request';

/**
 * 获取领域清单列表。
 * @param {string} [status] - 状态（可选，0启用 1停用）。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchDomainList(status?: string) {
	return request({
		url: '/export/extract/domain/list',
		method: 'get',
		params: { status },
	});
}

/**
 * 新增领域。
 * @param {Object} [obj] - 领域对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function addDomain(obj?: Object) {
	return request({
		url: '/export/extract/domain',
		method: 'post',
		data: obj,
	});
}

/**
 * 修改领域。
 * @param {Object} [obj] - 领域对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function updateDomain(obj?: Object) {
	return request({
		url: '/export/extract/domain',
		method: 'put',
		data: obj,
	});
}

/**
 * 批量删除领域。
 * @param {Object} [ids] - 领域 id 列表。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function delDomains(ids?: Object) {
	return request({
		url: '/export/extract/domain',
		method: 'delete',
		data: ids,
	});
}

/**
 * 触发 AI 归纳领域清单草稿（异步执行，防并发重入）。
 * 进度经 fetchGenerateProgress 查询，结果经 fetchGenerateResult 获取。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function generateDomainDraft() {
	return request({
		url: '/export/extract/domain/generate',
		method: 'post',
	});
}

/**
 * 获取 AI 归纳任务进度（running/done/total/error）。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchGenerateProgress() {
	return request({
		url: '/export/extract/domain/generate/progress',
		method: 'get',
	});
}

/**
 * 获取 AI 归纳领域草稿结果（任务完成后调用，结果保留至下次触发）。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchGenerateResult() {
	return request({
		url: '/export/extract/domain/generate/result',
		method: 'get',
	});
}

/**
 * 批量保存领域草稿。
 * @param {Object} [obj] - 领域草稿列表。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function saveDomainBatch(obj?: Object) {
	return request({
		url: '/export/extract/domain/batch',
		method: 'post',
		data: obj,
	});
}

/**
 * 触发全量领域打标（异步执行）。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function startDomainTagging() {
	return request({
		url: '/export/extract/domain/tagging',
		method: 'post',
	});
}

/**
 * 获取领域打标进度。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchTaggingProgress() {
	return request({
		url: '/export/extract/domain/tagging/progress',
		method: 'get',
	});
}

/**
 * 触发全量专家画像同步至 Dify 知识库（异步执行，先清空后重建）。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function startKnowledgeSync() {
	return request({
		url: '/export/extract/knowledge/sync',
		method: 'post',
	});
}

/**
 * 获取知识库同步进度（分片文件维度）。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchKnowledgeProgress() {
	return request({
		url: '/export/extract/knowledge/progress',
		method: 'get',
	});
}

/**
 * 获取 Dify 侧向量索引状态。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchKnowledgeIndexingStatus() {
	return request({
		url: '/export/extract/knowledge/indexing-status',
		method: 'get',
	});
}

/**
 * 执行专家抽取（异步启动）。
 * 后端立即返回运行中记录（status=2），进度经 fetchRunProgress 轮询，完成后经 fetchExtractRecord 刷新。
 * @param {Object} [obj] - {query: 自然语言抽取条件}。
 * @returns {Promise} 请求的 Promise 对象（运行中的抽取记录）。
 */
export function runExtraction(obj?: Object) {
	return request({
		url: '/export/extract/run',
		method: 'post',
		data: obj,
	});
}

/**
 * 获取当前抽取任务进度（running/stage/done/total/recordId/error）。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchRunProgress() {
	return request({
		url: '/export/extract/run/progress',
		method: 'get',
	});
}

/**
 * 按 id 获取抽取记录（任务完成后刷新状态与三档数量）。
 * @param {string|number} recordId - 抽取记录 id。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchExtractRecord(recordId: string | number) {
	return request({
		url: `/export/extract/record/${recordId}`,
		method: 'get',
	});
}

/**
 * 分页获取抽取历史记录。
 * @param {Object} [query] - {current, size, keyword}。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchExtractRecords(query?: Object) {
	return request({
		url: '/export/extract/record/page',
		method: 'get',
		params: query,
	});
}

/**
 * 分页获取抽取记录明细（已选/候选）。
 * @param {string|number} recordId - 抽取记录 id。
 * @param {Object} [query] - {current, size, grade}。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchExtractRecordDetail(recordId: string | number, query?: Object) {
	return request({
		url: `/export/extract/record/${recordId}/detail`,
		method: 'get',
		params: query,
	});
}

/**
 * 分页获取未匹配专家（按记录动态反查）。
 * @param {string|number} recordId - 抽取记录 id。
 * @param {Object} [query] - {current, size}。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function fetchUnmatchedExperts(recordId: string | number, query?: Object) {
	return request({
		url: `/export/extract/record/${recordId}/unmatched`,
		method: 'get',
		params: query,
	});
}
