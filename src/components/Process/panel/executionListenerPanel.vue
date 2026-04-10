<template>
  <div>
    <div class="element-drawer__button_save">
      <el-button type="primary" icon="Plus" size="small" @click="listenerSystemVisible = true">内置监听器</el-button>
      <el-button type="primary" icon="Plus" size="small" @click="openListenerForm(null, null)">自定义监听器</el-button>
    </div>
    <el-table :data="elementListenersList" size="small" border>
      <el-table-column label="序号" width="60px" type="index" />
      <el-table-column label="类型" width="60px" prop="event" />
      <el-table-column label="监听类型" width="80px" prop="listenerType" show-overflow-tooltip>
        <template #default="scope">
          {{ filterWord(scope.row.listenerType, listener_value_type) }}
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openListenerForm(scope.row, scope.$index)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-button size="small" type="danger" @click="removeListener(scope.row, scope.$index)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 监听器 编辑/创建 部分 -->
    <el-drawer v-model="listenerFormModelVisible" title="执行监听器" :modal="false" direction="rtl" size="600px">
      <el-form :model="listenerForm" size="small" label-width="96px" ref="listenerFormRef" @submit.prevent>
        <el-form-item label="事件类型" prop="event" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-select v-model="listenerForm.event">
            <el-option label="start" value="start" />
            <el-option label="end" value="end" />
          </el-select>
        </el-form-item>

        <el-form-item label="监听器类型" prop="listenerType" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-select v-model="listenerForm.listenerType">
            <el-option v-for="(item, index) in listener_value_type" :key="index" :label="item.label"
              :value="item.value"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-if="listenerForm.listenerType === 'classListener'" label="Java类" prop="class"
          key="listener-class" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerForm.class" clearable />
        </el-form-item>
        <el-form-item v-if="listenerForm.listenerType === 'expressionListener'" label="表达式" prop="expression"
          key="listener-expression" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerForm.expression" clearable />
        </el-form-item>
        <el-form-item v-if="listenerForm.listenerType === 'delegateExpressionListener'" label="代理表达式"
          prop="delegateExpression" key="listener-delegate" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerForm.delegateExpression" clearable />
        </el-form-item>
      </el-form>
      <el-divider />
      <p class="listener-filed__title">
        <span>
          <el-icon>
            <BellFilled />
          </el-icon>
          注入字段：
        </span>
        <el-button type="primary" size="small" @click="openListenerFieldForm(null, null)">添加字段</el-button>
      </p>

      <el-table :data="fieldsListOfListener" size="small" max-height="240" border fit style="flex: none">
        <el-table-column label="序号" width="80px" type="index" />
        <el-table-column label="字段名称" width="120px" prop="name" />
        <!-- <el-table-column label="字段类型" width="80px" show-overflow-tooltip
          :formatter="row => fieldTypeObject[row.fieldType]" /> -->
        <!-- <el-table-column label="值内容" width="80px" show-overflow-tooltip
          :formatter="row => row.string || row.expression" /> -->
        <el-table-column label="操作">
          <template #default="{ row, $index }">
            <el-button size="small" type="primary" @click="openListenerFieldForm(row, $index)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button size="small" type="danger" @click="removeListenerField(row, $index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="element-drawer__button">
        <el-button size="small" @click="listenerFormModelVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="saveListenerConfig">保 存</el-button>
      </div>
    </el-drawer>

    <!-- 内置监听器 -->
    <el-drawer v-model="listenerSystemVisible" title="执行监听器" :modal="false" direction="rtl" size="600px">
      <el-table v-loading="loading" :data="listenerList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="名称" align="center" prop="name" />
        <el-table-column label="类型" align="center" prop="eventType" />
        <el-table-column label="监听类型" align="center" prop="valueType">
          <template #default="scope">
            {{ filterWord(scope.row.valueType, listener_value_type) }}
          </template>
        </el-table-column>
        <el-table-column label="执行内容" align="center" prop="value" :show-overflow-tooltip="true" />
      </el-table>

      <pagination v-show="total > 0" :total="total" layout="prev, pager, next" :current="queryParams.current"
        :size="queryParams.size" @current-change="currentChangeHandle" @size-change="sizeChangeHandle" />

      <div class="element-drawer__button">
        <el-button size="small" @click="listenerSystemVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :disabled="listenerSystemChecked"
          @click="saveSystemListener">保存</el-button>
      </div>
    </el-drawer>

    <!-- 添加字段 -->
    <el-dialog title="字段配置" v-model="listenerFieldFormModelVisible" :close-on-click-modal="false" draggable>
      <el-form :model="listenerFieldForm" label-width="96px" ref="listenerFieldFormRef" style="height: 136px">
        <el-form-item label="字段名称：" prop="name" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerFieldForm.name" clearable />
        </el-form-item>
        <el-form-item label="字段类型：" prop="fieldType" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-select v-model="listenerFieldForm.fieldType">
            <el-option v-for="i in Object.keys(fieldTypeObject)" :key="i" :label="fieldTypeObject[i]" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="listenerFieldForm.fieldType === 'string'" label="字段值：" prop="string" key="field-string"
          :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerFieldForm.string" clearable />
        </el-form-item>
        <el-form-item v-if="listenerFieldForm.fieldType === 'expression'" label="表达式：" prop="expression"
          key="field-expression" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerFieldForm.expression" clearable />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="listenerFieldFormModelVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="saveListenerFiled">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="executionListenerPanel">
import { StrUtil } from '/@/utils/StrUtil.js';
import { useDict } from '/@/hooks/dict';
import { useMessage, useMessageBox } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
// 引入 modeler 相关信息
import { useModelerStore } from '/@/stores/modeler';
import { fetchList } from '/@/api/workflow/listener';
import {
  changeListenerObject,
  createListenerObject,
  createSystemListenerObject,
  updateElementExtensions
} from "../common/bpmnUtils.js";

// 定义props
const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

// 定义emit
const emit = defineEmits(['getExecutionListenerCount']);

// 国际化
const { t } = useI18n();

// 引入 modeler 相关信息
const modelerStore = useModelerStore();

// 获取设备状态字典
const { listener_value_type } = useDict('listener_value_type');


// 定义变量
const loading = ref(false);
const executionListenerCount = ref(0);
const listenerSystemVisible = ref(false);
const bpmnElementListeners = ref([]) as any;
const elementListenersList = ref([]) as any;
const otherExtensionList = ref([]);
const listenerList = ref([]);
const listenerFormModelVisible = ref(false);
const listenerForm = ref({}) as any;
const listenerFieldForm = ref({}) as any;
const listenerFieldFormRef = ref();
const listenerFormRef = ref();
const editingListenerFieldIndex = ref(-1);
const listenerFieldFormModelVisible = ref(false);
const fieldsListOfListener = ref([]) as any;
const editingListenerIndex = ref(-1);
const total = ref(0);
const listenerSystemChecked = ref(true);
const checkedListenerData = ref([]);
const queryParams = ref({
  current: 1,
  size: 10,
  type: 2,
});
const fieldTypeObject = {
  string: "字符串",
  expression: "表达式"
} as any;

// Methods
const resetListenersList = () => {
  bpmnElementListeners.value = modelerStore.element?.businessObject?.extensionElements?.values?.filter((ex: any) => ex.$type === `flowable:ExecutionListener`) ?? [];
  elementListenersList.value = bpmnElementListeners.value.map((listener: any) => initListenerType(listener));
  emit('getExecutionListenerCount', elementListenersList.value.length)
}

// 初始化监听器类型
const initListenerType = (listener: any) => {
  let listenerType
  if (listener.class) listenerType = "classListener"
  if (listener.expression) listenerType = "expressionListener"
  if (listener.delegateExpression) listenerType = "delegateExpressionListener"
  if (listener.script) listenerType = "scriptListener"
  return {
    ...JSON.parse(JSON.stringify(listener)),
    ...(listener.script ?? {}),
    listenerType: listenerType
  }
}

// 查询流程表达式列表
const getList = () => {
  loading.value = true;
  fetchList(queryParams.value).then(res => {
    total.value = res.data?.total || 0;
    listenerList.value = res.data?.records || [];
    loading.value = false
  })
}

// 分页事件（Vue3）
const sizeChangeHandle = (val: number) => {
  queryParams.value.current = val;
  queryParams.value.size = 1;
  getList();
};

const currentChangeHandle = (val: number) => {
  queryParams.value.current = val;
  getList();
};

// 多选框选中数据
const handleSelectionChange = (select: any) => {
  checkedListenerData.value = select;
  listenerSystemChecked.value = select.length !== 1;
}

// 保存内置监听器
const saveSystemListener = () => {
  if (checkedListenerData.value.length > 0) {
    checkedListenerData.value.forEach((value: any) => {
      // 保存其他配置
      const listenerObject = createSystemListenerObject(modelerStore.moddle, value, false, "flowable");

      (bpmnElementListeners.value as any[]).push(listenerObject);
      elementListenersList.value.push(changeListenerObject(value));
      otherExtensionList.value = modelerStore.element.businessObject?.extensionElements?.values?.filter((ex: any) => ex.$type !== `flowable:ExecutionListener`) ?? [];
      updateElementExtensions(modelerStore.moddle, modelerStore.modeling, modelerStore.element, otherExtensionList.value.concat(bpmnElementListeners.value));
    });
    emit('getExecutionListenerCount', elementListenersList.value.length);
  }

  checkedListenerData.value = [];
  listenerSystemChecked.value = true;
  // 隐藏侧边栏
  listenerSystemVisible.value = false;
}

// 保存监听器注入字段
const saveListenerFiled = () => {
  listenerFieldFormRef.value.validate((valid: boolean) => {
    if (valid) {
      if (editingListenerFieldIndex.value === -1) {
        fieldsListOfListener.value.push(listenerFieldForm.value);
        listenerForm.value.fields.push(listenerFieldForm.value);
      } else {
        fieldsListOfListener.value.splice(editingListenerFieldIndex.value, 1, listenerFieldForm.value);
        listenerForm.value.fields.splice(editingListenerFieldIndex.value, 1, listenerFieldForm.value);
      }
      listenerFieldFormModelVisible.value = false;

      listenerFieldForm.value = {};
      editingListenerFieldIndex.value = -1;
    }
  });
}

// 打开监听器表单 
const openListenerForm = (listener: any, index: any) => {
  if (listener) {
    listenerForm.value = initListenerForm(listener);
    editingListenerIndex.value = index;
  } else {
    listenerForm.value = {};
    editingListenerIndex.value = -1; // 标记为新增
  }

  if (listener && listener.fields) {
    fieldsListOfListener.value = listener.fields.map((field: any) => ({
      ...field,
      fieldType: field.string ? "string" : "expression"
    }));
  } else {
    fieldsListOfListener.value = [];
    listenerForm.value.fields = [];
  }
  // 打开侧边栏并清楚验证状态
  listenerFormModelVisible.value = true;
}

// 打开监听器字段编辑弹窗
const openListenerFieldForm = (field: any, index: any) => {
  listenerFieldForm.value = field ? JSON.parse(JSON.stringify(field)) : {};
  editingListenerFieldIndex.value = field ? index : -1;
  listenerFieldFormModelVisible.value = true;
}

// 保存监听器配置
const saveListenerConfig = () => {
  listenerFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const listenerObject = createListenerObject(modelerStore.moddle, listenerForm.value, false, "flowable");
      if (editingListenerIndex.value === -1) {
        bpmnElementListeners.value.push(listenerObject);
        elementListenersList.value.push(listenerForm.value);
      } else {
        bpmnElementListeners.value.splice(editingListenerIndex.value, 1, listenerObject);
        elementListenersList.value.splice(editingListenerIndex.value, 1, listenerForm.value);
      }

      // 保存其他配置
      otherExtensionList.value = modelerStore.element.businessObject?.extensionElements?.values?.filter((ex: any) => ex.$type !== `flowable:ExecutionListener`) ?? [];
      updateElementExtensions(modelerStore.moddle, modelerStore.modeling, modelerStore.element, otherExtensionList.value.concat(bpmnElementListeners.value));
      emit('getExecutionListenerCount', elementListenersList.value.length);
      // 4. 隐藏侧边栏
      listenerFormModelVisible.value = false;
      listenerForm.value = {};
    }
  });
}

// 初始化表单
const initListenerForm = (listener: any) => {
  let self = { ...listener };
  if (listener.script) {
    self = {
      ...listener,
      ...listener.script,
      scriptType: listener.script.resource ? "externalScript" : "inlineScript"
    };
  }
  if (listener.event === "timeout" && listener.eventDefinitions) {
    if (listener.eventDefinitions.length) {
      let k = "";
      for (let key in listener.eventDefinitions[0]) {
        console.log(listener.eventDefinitions, key);
        if (key.indexOf("time") !== -1) {
          k = key;
          self.eventDefinitionType = key.replace("time", "").toLowerCase();
        }
      }
      console.log(k);
      self.eventTimeDefinitions = listener.eventDefinitions[0][k].body;
    }
  }
  return self;
}

// 移除监听器
const removeListener = async (listener: any, index: any) => {
  try {
    await useMessageBox().confirm(t('common.delConfirmText'));
  } catch {
    return;
  }

  bpmnElementListeners.value.splice(index, 1);
  elementListenersList.value.splice(index, 1);
  otherExtensionList.value = modelerStore.element.businessObject?.extensionElements?.values?.filter((ex: any) => ex.$type !== `flowable:ExecutionListener`) ?? [];
  updateElementExtensions(modelerStore.moddle, modelerStore.modeling, modelerStore.element, otherExtensionList.value.concat(bpmnElementListeners.value));
  emit('getExecutionListenerCount', elementListenersList.value.length);
}

// 移除监听器字段
const removeListenerField = async (listener: any, index: any) => {
  try {
    await useMessageBox().confirm(t('common.delConfirmText'));
  } catch {
    return;
  }

  fieldsListOfListener.value.splice(index, 1);
  if (!Array.isArray(listenerForm.value.fields)) {
    listenerForm.value.fields = [];
  }
  listenerForm.value.fields.splice(index, 1);
}


// 监听
watch(() => props.id, (newVal) => {
  if (StrUtil.isNotBlank(newVal)) {
    resetListenersList();
  }
}, { immediate: true });


// 根据字典value获取label
const filterWord = (word: string, dict: any[]): string => {
  const result = dict.find((item: { value: string; }) => item.value == word);
  return result?.label || "";
};

// 初始化
onMounted(() => {
  getList();
});
</script>