import request from '/@/utils/request';

/**
 * 根据分页查询参数获取列表数据。
 *
 * @param query 查询参数
 * @returns
 */
export function fetchList(query?: Object) {
  return request({
    url: '/workflow/flowDefinition/page',
    method: 'get',
    params: query
  })
}

/**
 * 流程节点信息 
 *
 * @param query 查询参数
 * @returns
 */
export function flowXmlAndNode(query?: Object) {
  return request({
    url: '/workflow/flowTask/flowXmlAndNode',
    method: 'get',
    params: query
  })
}

/**
 * 启动流程
 * @param {Object} [obj] - 要添加的对象。
 * @returns {Promise} 请求的 Promise 对象
 */
export function definitionStart(data?: Object) {
  return request({
    url: '/workflow/flowDefinition/start',
    method: 'post',
    data: data
  })
}

/**
 * 读取xml文件
 *
 * @param deployId 部署id
 * @returns
 */
export function getXml(deployId?: string) {
  return request({
    url: `/workflow/flowDefinition/getXml/${deployId}`,
    method: 'get'
  })
}


/**
 * 添加一个新对象。
 * @param {Object} [obj] - 要添加的对象。
 * @returns {Promise} 请求的 Promise 对象 （true/false）。
 */
export function addObj(data?: Object) {
  return request({
    url: '/workflow/flowDefinition',
    method: 'post',
    data: data
  })
}

/**
 * 根据 ID 删除对象。
 * @param {Object} [ids] - 要删除的对象 ID。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function delObjs(ids?: Object) {
  return request({
    url: '/workflow/flowDefinition',
    method: 'delete',
    data: ids,
  });
}

/**
 * 更新一个已存在的对象。
 * @param {Object} [obj] - 要更新的对象。
 * @returns {Promise} 请求的 Promise 对象。
 */
export function updateObj(obj?: Object) {
  return request({
    url: '/workflow/flowDefinition/updateState',
    method: 'post',
    data: obj,
  });
}

// 指定流程办理人员列表
export function userList(query: any) {
  return request({
    url: '/workflow/flowDefinition/userList',
    method: 'get',
    params: query
  })
}

// 指定流程办理组列表
export function roleList(query: any) {
  return request({
    url: '/workflow/flowDefinition/roleList',
    method: 'get',
    params: query
  })
}

// 指定流程表达式
export function expList(query: any) {
  return request({
    url: '/workflow/flowDefinition/expList',
    method: 'get',
    params: query
  })
}

