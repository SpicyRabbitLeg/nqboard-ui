import request from '/@/utils/request';


/**
 * 我发起的流程
 *
 * @param query 查询参数
 * @returns
 */
export function fetchList(query?: Object) {
    return request({
        url: '/workflow/flowTask/myProcess',
        method: 'get',
        params: query
    })
}

/**
 * 我的待办列表
 *
 * @param query 查询参数
 * @returns
 */
export function todoList(query?: Object) {
    return request({
        url: '/workflow/flowTask/todoList',
        method: 'get',
        params: query
    })
}

/**
 * 根据 ID 删除对象。
 * @param {Object} [ids] - 要删除的对象 ID。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function delObjs(ids?: Object) {
    return request({
        url: '/workflow/flowInstance',
        method: 'delete',
        data: ids,
    });
}

/**
 * 取消申请
 * 
 * @param {Object} [obj] - 要取消的对象。
 * @returns {Promise} 请求的 Promise 对象 （true/false）。
 */
export function stopProcess(data?: Object) {
    return request({
        url: '/workflow/flowTask/stopProcess',
        method: 'post',
        data: data
    })
}

/**
 * 流程发起时获取下一节点
 * 
 * @param {Object} [obj] - 要发起的对象。
 * @returns {Promise} 请求的 Promise 对象 。
 */
export function getNextFlowNodeByStart(data?: Object) {
    return request({
        url: '/workflow/flowTask/getNextFlowNodeByStart',
        method: 'post',
        data: data
    })
}

/**
 * 获取下一节点
 * 
 * @param {Object} [obj] - 要发起的对象。
 * @returns {Promise} 请求的 Promise 对象 。
 */
export function getNextFlowNode(data?: Object) {
    return request({
        url: '/workflow/flowTask/getNextFlowNode',
        method: 'post',
        data: data
    })
}


/**
 * 获取流程变量
 * @param {String} [taskId] - 任务id
 * @returns {Promise} 请求的 Promise 对象 。
 */
export function getProcessVariables(taskId: string) {
    return request({
        url: "/workflow/flowTask/processVariables/" + taskId,
        method: 'get'
    })
}


/**
 * 流程历史流转记录
 * @param {String} [query] -  查询参数
 * @returns {Promise} 请求的 Promise 对象 。
 */
export function getFlowRecord(query?: Object) {
    return request({
        url: "/workflow/flowTask/flowRecord",
        method: 'get',
        params: query
    })
}


// =======================操作任务=================
/**
 * 审批任务
 * 
 * @param {Object} [obj] - 要发起的对象。
 * @returns {Promise} 请求的 Promise 对象 。
 */
export function complete(data?: Object) {
    return request({
        url: '/workflow/flowTask/complete',
        method: 'post',
        data: data
    })
}