<template>
  <!-- 顶部区域：状态 + 按钮组 -->
  <el-row justify="space-between" align="middle" :gutter="10" style="margin-bottom: 10px; padding: 0 10px;">
    <el-col :span="12">
      <div style="display: flex; align-items: center;">
        <span>状态：</span>
        <div style="margin-left: 10px; display: flex; gap: 20px;">
          <el-button type="success" size="small" disabled>已办理</el-button>
          <el-button type="warning" size="small" disabled>处理中</el-button>
          <el-button type="info" size="small" disabled>未进行</el-button>
        </div>
      </div>
    </el-col>
    <el-col :span="12" class="flow-viewer" style="text-align: right;">
      <!-- 按钮区域 -->
      <el-button-group>
        <el-popover effect="dark" content="适中" placement="bottom">
          <template #reference>
            <el-button size="small" icon="Aim" @click="fitViewport" />
          </template>
        </el-popover>
        <el-popover effect="dark" content="放大" placement="bottom">
          <template #reference>
            <el-button size="small" icon="Plus" @click="zoomViewport(true)" />
          </template>
        </el-popover>
        <el-popover effect="dark" content="缩小" placement="bottom">
          <template #reference>
            <el-button size="small" icon="Minus" @click="zoomViewport(false)" />
          </template>
        </el-popover>
      </el-button-group>
    </el-col>
  </el-row>
  <!-- 流程图显示 -->
  <div v-loading="loading" class="canvas" ref="flowCanvas" style="min-height:400px;"></div>
</template>

<script setup lang="ts" name="BpmnViewer">
import { CustomViewer as BpmnViewerClass } from "/@/components/Process/common/index.js";

// props
const props = defineProps<{
  // 回显数据传值
  flowData: {
    xmlData?: string;
    nodeData?: Array<{ key: string; completed: boolean }>;
  };
  procInsId?: string;
}>();

// 变量
const bpmnViewer = ref(null) as any;
const loading = ref(true);
const flowCanvas = ref();
const zoom = ref(1); // 用于放大缩小


// 加载流程图片
const loadFlowCanvas = async (flowData: any) => {
  try {
    await bpmnViewer.value.importXML(flowData.xmlData);
    await fitViewport();

    // 流程线高亮设置
    if (flowData.nodeData !== undefined && flowData.nodeData.length > 0 && props.procInsId) {
      await fillColor(flowData.nodeData);
    }
  } catch (err: any) {
    console.log("加载流程图",err);
  }
}

// 让图能自适应屏幕
const fitViewport = () => {
  zoom.value = bpmnViewer.value.get('canvas').zoom("fit-viewport", "auto");
  loading.value = false;
}

// 放大缩小
const zoomViewport = (zoomIn = true) => {
  zoom.value = bpmnViewer.value.get('canvas').zoom()
  zoom.value += (zoomIn ? 0.1 : -0.1)
  if (zoom.value >= 0.2) bpmnViewer.value.get('canvas').zoom(zoom.value);
}

// 设置高亮颜色的
const fillColor = (nodeData: any) => {
  const canvas = bpmnViewer.value.get('canvas');
  bpmnViewer.value.getDefinitions().rootElements[0].flowElements.forEach((n: any) => {
    const completeTask = nodeData.find((m: any) => m.key === n.id)
    const todoTask = nodeData.find((m: any) => !m.completed)
    const endTask = nodeData[nodeData.length - 1]
    if (n.$type === 'bpmn:UserTask') {
      if (completeTask) {
        canvas.addMarker(n.id, completeTask.completed ? 'highlight' : 'highlight-todo')
        n.outgoing?.forEach((nn: any) => {
          const targetTask = nodeData.find((m: any) => m.key === nn.targetRef.id)
          if (targetTask) {
            if (todoTask && completeTask.key === todoTask.key && !todoTask.completed) {
              canvas.addMarker(nn.id, todoTask.completed ? 'highlight' : 'highlight-todo')
              canvas.addMarker(nn.targetRef.id, todoTask.completed ? 'highlight' : 'highlight-todo')
            } else {
              canvas.addMarker(nn.id, targetTask.completed ? 'highlight' : 'highlight-todo')
              canvas.addMarker(nn.targetRef.id, targetTask.completed ? 'highlight' : 'highlight-todo')
            }
          }
        })
      }
    }
    // 排他网关
    else if (n.$type === 'bpmn:ExclusiveGateway') {
      if (completeTask) {
        canvas.addMarker(n.id, completeTask.completed ? 'highlight' : 'highlight-todo')
        n.outgoing?.forEach((nn: any) => {
          const targetTask = nodeData.find((m: any) => m.key === nn.targetRef.id)
          if (targetTask) {
            canvas.addMarker(nn.id, targetTask.completed ? 'highlight' : 'highlight-todo')
            canvas.addMarker(nn.targetRef.id, targetTask.completed ? 'highlight' : 'highlight-todo')
          }
        })
      }
    }
    // 并行网关
    else if (n.$type === 'bpmn:ParallelGateway') {
      if (completeTask) {
        canvas.addMarker(n.id, completeTask.completed ? 'highlight' : 'highlight-todo')
        n.outgoing?.forEach((nn: any) => {
          const targetTask = nodeData.find((m: any) => m.key === nn.targetRef.id)
          if (targetTask) {
            canvas.addMarker(nn.id, targetTask.completed ? 'highlight' : 'highlight-todo')
            canvas.addMarker(nn.targetRef.id, targetTask.completed ? 'highlight' : 'highlight-todo')
          }
        })
      }
    } else if (n.$type === 'bpmn:StartEvent') {
      n.outgoing?.forEach((nn: any) => {
        const completeTask = nodeData.find((m: any) => m.key === nn.targetRef.id)
        if (completeTask) {
          canvas.addMarker(nn.id, 'highlight')
          canvas.addMarker(n.id, 'highlight')
          return;
        }
      })
    } else if (n.$type === 'bpmn:EndEvent') {
      if (endTask.key === n.id && endTask.completed) {
        canvas.addMarker(n.id, 'highlight')
        return;
      }
    }
  })
}

// 监听id变化
watch(
  () => props.flowData,
  async (newVal) => {
    if (Object.keys(newVal).length > 0) {
      // 等待 DOM 渲染完成再初始化
      await nextTick();
      // 如果上一个 viewer 存在，先销毁
      if (bpmnViewer.value) {
        bpmnViewer.value.destroy();
        bpmnViewer.value = null;
      }

      // 初始化 Viewer
      bpmnViewer.value = new BpmnViewerClass({
        container: flowCanvas.value,
        height: 'calc(100vh - 200px)',
      });

      // 加载流程
      await loadFlowCanvas(newVal);
    }
  },
  { immediate: true }
);


</script>

<style lang="scss">
@import "../style/flow-viewer.scss";
</style>