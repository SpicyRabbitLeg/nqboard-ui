<template>
  <el-dialog :title="form.id ? '编辑' : '新增'" v-model="visible" :close-on-click-modal="false" draggable>
    <el-form ref="dataFormRef" :model="form" :rules="dataRules" formDialogRef label-width="90px" v-loading="loading">
      <el-row :gutter="24">
        <el-col :span="12" class="mb20">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>

        <el-col :span="12" class="mb20">
          <el-form-item label="表达式内容" prop="expression">
            <el-input v-model="form.expression" placeholder="请输入表达式内容" />
          </el-form-item>
        </el-col>

        <el-col :span="12" class="mb20">
          <el-form-item label="表达式类型" prop="dataType">
            <el-select v-model="form.dataType" placeholder="请选择表达式类型" clearable>
              <el-option label="系统指定" value="fixed" />
              <el-option label="动态选择" value="dynamic" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12" class="mb20">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" clearable>
              <el-option label="成功" value="0" />
              <el-option label="失败" value="1" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12" class="mb20">
          <el-form-item label="描述信息" prop="remark">
            <el-input v-model="form.remark" placeholder="请输入描述信息" />
          </el-form-item>
        </el-col>

        <el-col :span="12" class="mb20">
          <el-form-item label="排序字段" prop="orderNum">
            <el-input-number v-model="form.orderNum" :min="1" :max="100" placeholder="请输入排序字段" />
          </el-form-item>
        </el-col>

      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="onSubmit" :disabled="loading">确 认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="FlwExpressionDialog">
import { useDict } from '/@/hooks/dict';
import { useMessage } from "/@/hooks/message";
import { getObj, addObj, putObj, validateExist } from '/@/api/workflow/flwExpression'
import { rule } from '/@/utils/validate';
const emit = defineEmits(['refresh']);

// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);
// 定义字典

// 提交表单数据
const form = reactive({
  id: '',
  orderNum: '',
  name: '',
  expression: '',
  dataType: '',
  status: '',
  remark: '',
});

// 定义校验规则
const dataRules = ref({
})

// 打开弹窗
const openDialog = (id: string) => {
  visible.value = true
  form.id = ''

  // 重置表单数据
  nextTick(() => {
    dataFormRef.value?.resetFields();
  });

  // 获取flwExpression信息
  if (id) {
    form.id = id
    getFlwExpressionData(id)
  }
};

// 提交
const onSubmit = async () => {
  const valid = await dataFormRef.value.validate().catch(() => { });
  if (!valid) return false;

  try {
    loading.value = true;
    form.id ? await putObj(form) : await addObj(form);
    useMessage().success(form.id ? '修改成功' : '添加成功');
    visible.value = false;
    emit('refresh');
  } catch (err: any) {
    useMessage().error(err.msg);
  } finally {
    loading.value = false;
  }
};


// 初始化表单数据
const getFlwExpressionData = (id: string) => {
  // 获取数据
  loading.value = true
  getObj({ id: id }).then((res: any) => {
    Object.assign(form, res.data[0])
  }).finally(() => {
    loading.value = false
  })
};

// 暴露变量
defineExpose({
  openDialog
});
</script>
