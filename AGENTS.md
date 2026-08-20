# CLAUDE.md — NQBoard-UI 前端开发手册

> 本文件是 nqboard-ui 前端项目的权威开发约定，面向本仓库内的所有编码任务。
> **自定义指令优先级：本文件 < 用户本次对话的显式指令。**

---

## 项目概述

NQBoard-UI 是 NQBoard 微服务开发平台的前端（衍生自 pig4cloud Vue3 管理模板），采用 **Vue 3 + TypeScript + Vite** 体系，同时适配微服务（经网关）与单体（由 `nqboard-boot` 统一提供）两种后端部署形态。

| 技术 | 版本 | 技术 | 版本 |
|------|------|------|------|
| Vue | 3.5.13 | Element Plus | 2.13.1 |
| TypeScript | 5.6.3 | Pinia | 2.3.0 |
| Vite | 5.4.11 | Vue Router | 4.4.5 |
| axios | 1.13.2 | Vue I18n | 9.14.2 |
| Tailwind CSS | 3.4.17 | ECharts / BPMN.js | 5.5.1 / 11.x |

核心能力：OAuth2 登录等、RBAC 权限（按钮级 `v-auth`）、动态路由（后端菜单控制）、国际化、数据字典、代码生成、可视化流程（BPMN）、WebSocket 消息。Node 要求 **>= 18**。

---

## 技术约定（编码前必读）

### 工具链 / 自动导入（重要）

- **路径别名**：`/@` → `src`（`vite.config.ts` alias 与 `tsconfig.json` paths 均配置）。**所有 import 一律使用 `/@/...`**：
  ```ts
  import request from '/@/utils/request';
  import { useUserInfo } from '/@/stores/userInfo';
  ```
- **unplugin-auto-import 自动导入**：`vue / vue-router / pinia` 的 API（`ref`、`reactive`、`computed`、`watch`、`nextTick`、`useRoute`、`useRouter`、`defineAsyncComponent`、pinia 的 `defineStore` 等）**无需手动 import**，已自动注册（声明见 `auto-imports.d.ts`）。**不要**再手写 `import { ref } from 'vue'`。
- **unplugin-vue-setup-extend**：`<script setup lang="ts" name="xxx">` 通过 `name` 定义组件名，用于 keep-alive 缓存与 DevTools 展示。
- **i18n 全局注入**：模板用 `$t('key')`，`<script>` 中用 `useI18n()` 解构 `t`。

### 环境变量（不硬编码）

- `.env`：架构开关 `VITE_IS_MICRO`、后端请求前缀 `VITE_API_URL`、OAuth2 客户端（`VITE_OAUTH2_PASSWORD_CLIENT`=pig:pig）、密码加密密钥 `VITE_PWD_ENC_KEY`、验证码/注册/WebSocket 开关等。
- `.env.development`：`VITE_PORT=8888`、`VITE_OPEN`、`VITE_ADMIN_PROXY_PATH`（代理到单体后端，默认 `http://127.0.0.1:9999`）。
- 开发代理：`/api` → 后端（`rewrite` 去掉 `/api`）、`^/ws/info/.*` → WebSocket。

### 常用命令

```bash
npm run dev          # 开发（vite --force）
npm run build        # 生产构建（terser + gzip，drop console/debugger）
npm run lint:eslint  # eslint --fix
npm run prettier     # prettier --write
```

---

## 核心架构

### API 层（src/api）

按后端域分目录：`admin / device / daemon / gen / login / workflow`。每个域下 `x.ts` 暴露一组请求函数（原子化、一个后端接口一个函数，**禁止在视图里直接调 request**）：

```ts
import request from '/@/utils/request';

export function fetchList(query?: Object) {
	return request({ url: '/device/category/page', method: 'get', params: query });
}
export function addObj(obj?: Object) {
	return request({ url: '/device/category', method: 'post', data: obj });
}
export function getDetails(obj?: Object) {
	return request({ url: '/device/category/details', method: 'get', params: obj });
}
export function delObjs(ids?: Object) {
	return request({ url: '/device/category', method: 'delete', data: ids });
}
export function putObj(obj?: Object) {
	return request({ url: '/device/category', method: 'put', data: obj });
}
```

命名约定（全项目统一）：
- 分页：`fetchList`
- 新增：`addObj`；修改：`putObj`；删除（批量）：`delObjs`
- 条件详情：`getDetails`（返回列表） / `getObj`（按 id）
- 校验唯一：`validateExist(rule, value, callback, isEdit)`
- URL 统一带域前缀（`/device/...`、`/admin/...`、`/workflow/...`），**索引/分页参数由 `useTable` 统一拼接**。

> **请求前缀适配**：`src/utils/other.ts` 的 `adaptationUrl` 在请求拦截器自动执行——微服务架构 URL 不变；单体架构自动给 `/device/xx` 等前拼 `/admin`。新增接口 URL 只需写原路径，不要手动加 `/admin`。

### CRUD 页面三层约定（标准样板 · 以 `views/device/category` 为参考）

```text
src/api/<域>/<模块>.ts            → 请求函数
src/views/<域>/<模块>/index.vue   → 列表页（搜索 + 表格 + 分页 + 权限按钮）
src/views/<域>/<模块>/form.vue    → 新增/编辑弹窗（el-dialog）
src/views/<域>/<模块>/i18n/       → 国际化（zh-cn.ts / en.ts）
```

#### 1) 列表页 index.vue
- 使用 **`useTable` hook**（`src/hooks/table.ts`）：定义 `BasicTableProps` 类型的 `state`，含 `queryForm`、`pageList: fetchList`、`ascs`/`descs` 排序等。
  ```ts
  const state: BasicTableProps = reactive<BasicTableProps>({
      queryForm: { name: '' },
      pageList: fetchList,
      ascs: ['order_num'],
  });
  const { getDataList, currentChangeHandle, sizeChangeHandle, sortChangeHandle, downBlobFile, tableStyle } = useTable(state);
  ```
- 表格：`el-table` + `v-loading`，列用 `prop` + `:label="t('xx.xx')"`，文本截断 `show-overflow-tooltip`，操作列 `#default="scope"`。
- 分页：全局组件 `<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />`。
- 新增/编辑/删除按钮：**必须带权限指令** `v-auth="'device_iotCategory_add'"`（按钮权限串 = `域_实体_操作`，与后端 `@HasPermission` 对应）。还有 `v-auths`（满足其一）/ `v-auth-all`。
- 导入 `FormDialog = defineAsyncComponent(() => import('./form.vue'))` 加载弹窗组件；`formDialogRef.openDialog(id)` 打开新增/编辑。

#### 2) 表单弹窗 form.vue
- 结构：`el-dialog` + `el-form`（`:rules="dataRules"`）+ 底部确定/取消按钮。
- `openDialog(id)`：有 id 走编辑（`getObj` 回填 `Object.assign(form, res.data[0])`），无 id 走新增；`nextTick` 重置表单。
- `onSubmit`：先 `validate()`，再 `form.id ? await putObj(form) : await addObj(form)`，成功 `useMessage().success(...)`，失败 `useMessage().error(err.msg)`，最后 `emit('refresh')` 通知列表刷新。
- `defineExpose({ openDialog })` 暴露给父组件。
- 校验：`dataRules` + 前端唯一性用 `validateExist(rule, value, callback, form.id !== '')`。

#### 3) 国际化 i18n
- 在页面目录建 `i18n/zh-cn.ts`、`en.ts`，**key 用目录同名命名空间**（如 `category`），自动被 `src/i18n/index.ts` 的 `import.meta.glob` 合并（无需手动注册）。
  ```ts
  export default { category: { name: '分类名称', addBtn: '新增', ... } };
  ```
- 模板 `$t('category.name')`；`<script>` 用 `const { t } = useI18n()` 后 `t('category.name')`。
- **注意**：新增 key 不要与框架已有的 `src/i18n/lang` 及公共 key（`common.addBtn`、`common.queryBtn` 等）重复。

### 请求封装（src/utils/request.ts）

- 单例 axios，`baseURL = VITE_API_URL`，超时 50s；`paramsSerializer` 用 qs `arrayFormat: 'repeat'`（数组重复参数）。
- **请求拦截器**：
  - 自动加 `Authorization: Bearer <token>`；请求头传 `skipToken: true` 可跳过（如登录、内部调用）。
  - 请求加密：传 `ENC_FLAG` 请求头则用 `other.encryption` 加密 body。
  - 自动执行 `other.adaptationUrl` 适配单体/微服务路径。
- **响应拦截器**：
  - `response.data.code === 1` 判定为失败，抛异常（对应后端 `R`：成功 `code=0`，失败统一走异常）。
  - 密文响应自动解密。
  - HTTP 424 → 令牌过期，`useMessageBox().confirm` 提示重新登录并清缓存跳登录页。
- **返回结构**：拦截器返回的是后端统一返回体（`{code, msg, data}`），业务数据在 `.data`。例如 `getObj(...).then(res => Object.assign(form, res.data[0]))`。

### 状态管理（Pinia）

- 目录 `src/stores`，用 `defineStore`（自动导入）。常见：
  - `useUserInfo`：用户信息与按钮权限 `authBtnList`；`userInfo` 用于 `v-auth` 判断。
  - `useThemeConfig`、`useKeepALiveNames`、`useRoutesList`、`useTagsViewRoutes`、`useDict` 等。
  - `useDict()` hook：`const { data_list, columns, ... } = useDict('字典类型')`，与 `<DictTag :options="..." />` 组件配套渲染字典。
- 获取 store 用 `useXxx(pinia)`（传 pinia 实例），读取响应式值用 `storeToRefs`。

### 路由 / 菜单（后端控制为主）

- `src/router/index.ts`：`createWebHashHistory()` 哈希路由；`backEnd.ts`（后端返回菜单）与 `frontEnd.ts`（前端静态路由）二选一。
- **默认后端控制路由**（菜单管理后台有"菜单管理"）：新增页面**无需改前端路由**，只需：
  1. 在 `src/views/<域>/<模块>/` 建 `index.vue`（列表）+ `form.vue`（弹窗）+ `i18n/`。
  2. 在**后端菜单管理**里新增菜单（注意组件路径 `views/device/category/index`、图标、权限串等），权限由接口下发。
- 404 / 401 界面见 `router/route.ts` 的 `notFoundAndNoPower`。

### 全局组件 / 常用工具

- 全局组件（`src/components`）：`Pagination`、`DictTag`、`TreeSelect`、`QueryTree`、`Upload`、`CodeEditor`、`Crontab`、`IconSelector`、`RightToolbar`、`FormTable`、`Popup`、`DelWrap`、`NameAvatar`、`ChinaArea`、`Editor`、`Flow/Process`（流程）等。
- `src/utils` 常用：
  - `storage.ts` → `Session`（get/set/clear、`getToken`）
  - `request.ts` → 全局请求
  - `other.ts` → `encryption/decryption`、`adaptationUrl`、`handleTree`、`toUnderline`、`getQueryString`
  - `validate.ts`、`errorCode.ts`、`formatTime.ts`、`arrayOperation.ts`（`judementSameArr`）
  - `authFunction.ts`、`mitt.ts`、`wartermark.ts`
- TS 类型集中在 `src/types`。

---

## 开发规范（最高优先级，必须严格遵守）

### 禁止自动提交

- **AI/Copilot 一律不得自动执行 `git add / git commit / git push`。**
- 所有变更由开发者本人审阅后手动提交；需要机器人辅助时，必须显式征得用户同意并说明将执行的 git 命令。
- 提交信息格式与仓库风格一致，二选一：
  - 常规：`<type>(<scope>): <描述>`，如 `<feat>(device): 新增产品分类页面`
  - 或中文：`类型：<类型> 描述：<描述>`

### 基本规范

1. **沿用现有目录结构，不随意新建包/目录、不改变项目约定**；新业务严格走 `api → views/<域>/<模块>/{index,form,i18n}` 三层。
2. **import 一律用 `/@/` 别名**；`vue/vue-router/pinia` 的响应式 API 已被 auto-import，**禁止重复 import**。
3. **禁止**在视图里直接 `request()`，一律走 `src/api` 封装的函数。
4. 按钮级鉴权必须加 `v-auth`；新增页面须配套 i18n（至少 `zh-cn.ts`）。
5. 请求失败提示使用 `useMessage()` / `useMessageBox()`，**禁止裸 `alert`/`console`**。
6. 敏感信息（密钥、clientId、Salt、后端地址）一律走 `.env*`，**禁止硬编码在源码**。
7. 样式优先 Tailwind 工具类与全局布局容器（`layout-padding`、`layout-padding-view`、`mb8`、`ml10`）；必要变更才用 scoped 样式。

### 编码前知识查阅（PKR）

- 编码任何功能前，**必须先检索本手册及 `src/components`、`src/hooks`、`src/utils`、同域已有 `views`**，确认是否已有可复用能力与既定模式，再开始编码。

### 计划模式约束

- 涉及多文件、多模块或复杂交互（流程/BPMN、权限、跨域联调）时，**先给出实现规划（涉及文件、改动点、顺序、风险），经确认后再落代码**，避免破坏既有架构约定。
