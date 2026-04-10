<template>
    <div v-loading="isView" class="flow-containers" :class="{ 'view-mode': isView }">
        <el-container style="height: 100%">
            <el-header style="border-bottom: 1px solid rgb(218 218 218);height: auto;padding-left:0">
                <div style="display: flex; padding: 10px 0; justify-content: space-between;">
                    <el-button-group>
                        <el-upload action="" :before-upload="openBpmn"
                            style="margin-right: 10px; display:inline-block;">
                            <el-tooltip effect="dark" content="加载xml" placement="bottom">
                                <el-button size="small" icon="DocumentAdd" />
                            </el-tooltip>
                        </el-upload>
                        <el-tooltip effect="dark" content="新建" placement="bottom">
                            <el-button size="small" icon="CirclePlusFilled" @click="newDiagram" />
                        </el-tooltip>
                        <el-tooltip effect="dark" content="自适应屏幕" placement="bottom">
                            <el-button size="small" icon="Aim" @click="fitViewport" />
                        </el-tooltip>
                        <el-tooltip effect="dark" content="放大" placement="bottom">
                            <el-button size="small" icon="Plus" @click="zoomViewport(true)" />
                        </el-tooltip>
                        <el-tooltip effect="dark" content="缩小" placement="bottom">
                            <el-button size="small" icon="Minus" @click="zoomViewport(false)" />
                        </el-tooltip>
                        <el-tooltip effect="dark" content="后退" placement="bottom">
                            <el-button size="small" icon="Back" @click="undo()" />
                        </el-tooltip>
                        <el-tooltip effect="dark" content="前进" placement="bottom">
                            <el-button size="small" icon="Right" @click="redo()" />
                        </el-tooltip>
                    </el-button-group>
                    <el-button-group>
                        <el-button size="small" icon="View" @click="showXml">查看xml</el-button>
                        <el-button size="small" icon="Download" @click="saveXML(true)">下载xml</el-button>
                        <el-button size="small" icon="PictureFilled" @click="saveImg('svg', true)">下载svg</el-button>
                        <el-button size="small" type="primary" @click="save">保存模型</el-button>
                        <el-button size="small" type="danger" @click="goBack()">关闭</el-button>
                    </el-button-group>
                </div>
            </el-header>
            <!-- 流程设计页面 -->
            <el-container style="align-items: stretch">
                <el-main>
                    <div ref="canvas" class="canvas" />
                </el-main>

                <!--右侧属性栏-->
                <el-card shadow="never" class="normalPanel">
                    <panel v-if="loadCanvas" />
                </el-card>
            </el-container>
        </el-container>
    </div>
</template>

<script setup lang="ts" name="BpmnModel">
// 画布
import Modeler from 'bpmn-js/lib/Modeler.js';
// 汉化
import customTranslate from './customPanel/customTranslate.js';
// 初始化xml脚本
import getInitStr from './flowable/init.js';
// 字符串工具类
import { StrUtil } from '/@/utils/StrUtil.js';
// 引入flowable的节点文件
import FlowableModule from './flowable/flowable.json';
import customControlsModule from './customPanel/index.js';
// 引入 modeler 相关信息
import { useModelerStore } from '/@/stores/modeler';


// 引入组件
// 右侧配置项
const Panel = defineAsyncComponent(() => import('./panel.vue'));

// 引入 modeler 相关信息
const modelerStore = useModelerStore();

// 定义props
const props = defineProps({
    xml: {
        type: String,
        default: ''
    },
    isView: {
        type: Boolean,
        default: false
    },
})

// 定义emit
const emit = defineEmits(['save', 'showXml']);


// 字段
const modeler = ref(null);
const zoom = ref(1);
const loadCanvas = ref(false);
const router = useRouter();
const canvas = ref(null);



const additionalModules = computed(() => {
    const Modules = []
    Modules.push(customControlsModule)
    Modules.push({ //汉化
        translate: ['value', customTranslate]
    })
    return Modules;
});


// 初始化bpmn 实例
onMounted(() => {
    /** 创建bpmn 实例 */
    const _modeler = markRaw(new Modeler({
        container: canvas.value,
        additionalModules: additionalModules.value,
        moddleExtensions: { flowable: FlowableModule },
        keyboard: { bindTo: document },
    }));

    // 避免 Vue 代理这些对象
    modelerStore.modeler = markRaw(_modeler);
    modelerStore.modeling = markRaw(_modeler.get("modeling"));
    modelerStore.moddle = markRaw(_modeler.get("moddle"));
    modelerStore.canvas = markRaw(_modeler.get("canvas"));
    modelerStore.bpmnFactory = markRaw(_modeler.get("bpmnFactory"));
    modelerStore.elRegistry = markRaw(_modeler.get("elementRegistry"));

    if (StrUtil.isBlank(props.xml)) {
        newDiagram();
    } else {
        createNewDiagram(props.xml);
    }
});

// 监听外部传入的 xml，避免异步加载导致初始化为空
watch(() => props.xml, async (data) => {
    if (data && data.trim() !== '') {
        await createNewDiagram(data);
    }
});

// 根据默认文件初始化流程图
const newDiagram = () => {
    createNewDiagram(getInitStr())
}

// 根据提供的xml创建流程图
const createNewDiagram = async (data: any) => {
    // 将字符串转换成图显示出来
    if (!modelerStore.modeler) return;
    const xmlStr = typeof data === 'string' ? data : String(data || '');
    if (!xmlStr) return;
    const normalized = xmlStr.replace(/<!\[CDATA\[(.+?)]]>/g, function (match: any, str: any) {
        return String(str).replace(/</g, '&lt;')
    });
    try {
        // 导入 XML
        await modelerStore.modeler.importXML(normalized);
        fitViewport();
    } catch (err) {
        console.error('importXML error:', (err as any).message, (err as any).warnings)
    }
}

// 让图能自适应屏幕
const fitViewport = () => {
    // 先让画布自适应
    zoom.value = modelerStore.canvas.zoom('fit-viewport')
    // 优先通过 bpmn-js 内部 svg 查找 viewport
    const internalViewport: SVGGraphicsElement | null = (modelerStore.canvas as any)?._svg?.querySelector?.('.viewport') ?? null
    // 兼容原来的选择器
    const domViewport: SVGGraphicsElement | null = document.querySelector('.flow-containers .viewport') as SVGGraphicsElement | null
    const viewportEl = internalViewport || domViewport

    if (viewportEl) {
        const bbox = viewportEl.getBBox()
        const currentViewBox = modelerStore.canvas.viewbox()
        const elementMid = {
            x: bbox.x + bbox.width / 2 - 65,
            y: bbox.y + bbox.height / 2
        }
        modelerStore.canvas.viewbox({
            x: elementMid.x - currentViewBox.width / 2,
            y: elementMid.y - currentViewBox.height / 2,
            width: currentViewBox.width,
            height: currentViewBox.height
        })
        zoom.value = (bbox.width / currentViewBox.width) * 1.8
    }
    // 无论是否拿到 viewport，都显示右侧属性面板
    loadCanvas.value = true;
}

// 放大缩小
const zoomViewport = (zoomIn = true) => {
    zoom.value = modelerStore.canvas.zoom()
    zoom.value += (zoomIn ? 0.1 : -0.1)
    modelerStore.canvas.zoom(zoom.value)
}

// 获取流程基础信息
const getProcess = () => {
    const element = getProcessElement()
    return {
        id: element.id,
        name: element.name,
        category: element.processCategory
    }
}

// 获取流程主面板节点
const getProcessElement = () => {
    const rootElements = modelerStore.modeler.getDefinitions().rootElements
    for (let i = 0; i < rootElements.length; i++) {
        if (rootElements[i].$type === 'bpmn:Process') return rootElements[i]
    }
}

// 保存xml
const saveXML = async (download = false) => {
    try {
        const { xml } = await modelerStore.modeler.saveXML({ format: true })
        if (download) {
            downloadFile(`${getProcessElement().name}.bpmn20.xml`, xml, 'application/xml')
        }
        return xml
    } catch (err) {
        console.log(err)
    }
}

// 撤销
const undo = async () => {
    (modeler.value as any).get('commandStack').undo();
}

// 前进
const redo = async () => {
    (modeler.value as any).get('commandStack').redo();
}


// 保存流程图为svg
const saveImg = async (type = 'svg', download = false) => {
    try {
        const { svg } = await modelerStore.modeler.saveSVG({ format: true });
        if (download) {
            downloadFile(getProcessElement().name, svg, 'image/svg+xml')
        }
        return svg;
    } catch (err) {
        console.log(err)
    }
}

// 保存流程图
const save = async () => {
    const process = getProcess()
    const xml = await saveXML()
    const svg = await saveImg()
    const result = { process, xml, svg }
    emit('save', result)
    window.parent.postMessage(result, '*')
    goBack()
}


// 在线查看xml
const showXml = async () => {
    try {
        const xml = await saveXML();
        emit('showXml', xml);
    } catch (err) {
        console.log(err);
    }
}

// 打开流程文件
const openBpmn = (file: any) => {
    const reader = new FileReader()
    reader.readAsText(file, 'utf-8')
    reader.onload = () => {
        createNewDiagram(reader.result)
    }
    return false
}

// 下载流程文件
const downloadFile = (filename: any, data: any, type: any) => {
    const a = document.createElement('a')
    const url = window.URL.createObjectURL(new Blob([data], { type: type }))
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
}

/** 关闭当前标签页并返回上个页面 */
const goBack = () => {
    router.push({
        path:"/workflow/definition/index",
        query: {
            time: Date.now()
        }
    })
}
</script>
<style lang="scss">
/*左边工具栏以及编辑节点的样式*/
@import "bpmn-js/dist/assets/diagram-js.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css";
@import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

.view-mode {

    .el-header,
    .el-aside,
    .djs-palette,
    .bjs-powered-by {
        display: none;
    }

    .el-loading-mask {
        background-color: initial;
    }

    .el-loading-spinner {
        display: none;
    }
}

.flow-containers {
    width: 100%;
    height: 100%;

    .canvas {
        min-height: 850px;
        width: 100%;
        height: 100%;
        background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMGUwZTAiIG9wYWNpdHk9Ii4yIi8+PHBhdGggZD0iTTQwIDBIMHY0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTBlMGUwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+")
    }

    .panel {
        position: absolute;
        right: 0;
        top: 50px;
        width: 300px;
    }

    .load {
        margin-right: 10px;
    }

    .normalPanel {
        width: 460px;
        height: 100%;
        padding: 20px 20px;
    }

    .el-main {
        position: relative;
        padding: 0;
    }

    .el-main .button-group {
        display: flex;
        flex-direction: column;
        position: absolute;
        width: auto;
        height: auto;
        top: 10px;
        right: 10px;
    }

    .button-group .el-button {
        width: 100%;
        margin: 0 0 5px;
    }
}
</style>