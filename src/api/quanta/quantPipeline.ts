import request from '/@/utils/request';

/**
 * 异步触发完整流水线（立即返回运行id）。
 *
 * @returns Promise
 */
export function runPipeline() {
	return request({
		url: '/quanta/quantPipeline/run',
		method: 'post',
	});
}

/**
 * 异步重跑单个步骤。
 *
 * @param step 步骤编码
 * @returns Promise
 */
export function runStep(step: String) {
	return request({
		url: '/quanta/quantPipeline/runStep',
		method: 'post',
		params: { step },
	});
}

/**
 * 查询流水线支持的全部步骤定义。
 *
 * @returns Promise
 */
export function fetchSteps() {
	return request({
		url: '/quanta/quantPipeline/steps',
		method: 'get',
	});
}

/**
 * 查询指定日期流水线各步骤最新执行状态。
 *
 * @param runDate 运行日期 YYYYMMDD，为空取今天
 * @returns Promise
 */
export function fetchLogs(runDate?: String) {
	return request({
		url: '/quanta/quantPipeline/logs',
		method: 'get',
		params: { runDate },
	});
}

/**
 * 数据就绪检查（股票日线当日覆盖率）。
 *
 * @returns Promise
 */
export function fetchReadiness() {
	return request({
		url: '/quanta/quantPipeline/readiness',
		method: 'get',
	});
}
