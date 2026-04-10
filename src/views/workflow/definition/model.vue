<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <process :xml="xml" :is-view="false" v-if="dataExit" @save="save" @showXml="showXml" />
            <!-- 在线查看xml -->
            <el-drawer v-model="xmlOpen" :title="xmlTitle" :modal="false" direction="rtl" :size="1000">
                <!-- 设置对话框内容高度 -->
                <el-scrollbar>
                    <pre>
                        <code ref="xmlCode" class="xml"></code>
                    </pre>
                </el-scrollbar>
            </el-drawer>
        </div>
    </div>
</template>

<script setup lang="ts" name="model">
import { useMessage } from '/@/hooks/message';
import vkBeautify from 'vkbeautify/index.js';
import { useI18n } from 'vue-i18n';
import hljs from 'highlight.js';
import { nextTick, ref } from 'vue';
import { useModelerStore } from '/@/stores/modeler';
import { getXml, roleList, addObj, userList, expList } from "/@/api/workflow/definition";

// 引入组件
const process = defineAsyncComponent(() => import('/@/components/Process/index.vue'));

// 使用国际化插件
const { t } = useI18n();

// 引入 modeler 相关信息
const modelerStore = useModelerStore();

// 变量
const xmlTitle = ref("xml查看");
const xmlOpen = ref(false);
const xmlData = ref('');

// 路由对象
const route = useRoute();
const router = useRouter();

// 响应式数据
const xml = ref();
const modeler = ref('');
const dataExit = ref(false);

// XML代码元素引用
const xmlCode = ref<HTMLElement | null>(null);

// 获取xml数据
const getXmlData = async (deployId: string) => {
    const res = await getXml(deployId)
    xml.value = res.data
    modeler.value = res.data
}

// 保存xml
const save = async (data: any) => {
    try {
        const params = {
            name: data.process.name,
            category: data.process.category,
            xml: data.xml
        }
        const res = await addObj(params);
        useMessage().success(t('definition.saveSuccess'));
        router.push({ path: '/workflow/definition/index', query: { t: Date.now() } })
    } catch (error: any) {
        // 显示错误提示
        const errorMessage = error?.response?.data?.msg || error?.message || t('definition.saveFailed');
        useMessage().error(errorMessage);
    }
}

// 展示xml
const showXml = async (xml: string) => {
    xmlTitle.value = "xml查看";
    xmlOpen.value = true;
    xmlData.value = vkBeautify.xml(xml);
    await nextTick();
    if (xmlCode.value) {
        xmlCode.value.textContent = xmlData.value;
        hljs.highlightBlock(xmlCode.value);
    }
}

// 获取人员、角色、表达式列表
const getDataList = async () => {
    const [users, roles, exps] = await Promise.all([
        userList({}),
        roleList({}),
        expList({})
    ])
    modelerStore.userList = users.data;
    modelerStore.roleList = roles.data;
    modelerStore.expList = exps.data;
    dataExit.value = true;
}

// 生命周期
onMounted(() => {
    const deployId = route.query?.deployId as string;
    if (deployId) {
        getXmlData(deployId);
    }
    getDataList();
})
</script>

<style scoped>
/* 可选：为高亮添加样式，确保 Highlight.js 的 CSS 已引入全局（如在 main.ts 或 App.vue 中引入 'highlight.js/styles/default.css'） */
pre {
    background: #f4f4f4;
    border-radius: 4px;
    padding: 16px;
    overflow: auto;
}
</style>