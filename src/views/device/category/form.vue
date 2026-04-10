<template>
	<el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible" :close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="form" :rules="dataRules" formDialogRef label-width="120px" v-loading="loading">
			<el-form-item :label="$t('category.name')" prop="name">
				<el-input :placeholder="$t('category.inputNameTip')" v-model="form.name" />
			</el-form-item>

			<el-form-item :label="$t('category.orderNum')" prop="orderNum">
				<el-input-number :min="1" v-model="form.orderNum" controls-position="right" />
			</el-form-item>

			<el-form-item :label="$t('category.remark')" prop="remark">
				<el-input
					:placeholder="$t('category.inputRemarkTip')"
					type="textarea"
					show-word-limit
					maxlength="500"
					:autosize="{ minRows: 2, maxRows: 4 }"
					v-model="form.remark"
				/>
			</el-form-item>
		</el-form>

		<template #footer>
			<span class="dialog-footer">
				<el-button @click="visible = false">{{ $t('common.cancelButtonText') }}</el-button>
				<el-button type="primary" @click="onSubmit" :disabled="loading">{{ $t('common.confirmButtonText') }}</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<script setup lang="ts" name="categoryDialog">
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj, validateExist } from '/@/api/device/category';
import { useI18n } from 'vue-i18n';

// 使用国际化插件
const { t } = useI18n();

const emit = defineEmits(['refresh']);

// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);

// 提交表单数据
const form = reactive({
	id: '',
	name: '',
	orderNum: 1,
	remark: '',
});

// 定义校验规则
const dataRules = ref({
	name: [{ required: true, message: '产品分类名称不能为空', trigger: 'blur' }],
});

// 打开弹窗
const openDialog = (id: string) => {
	visible.value = true;
	form.id = '';

	// 重置表单数据
	nextTick(() => {
		dataFormRef.value?.resetFields();
	});

	// 获取iotCategory信息
	if (id) {
		form.id = id;
		getCategoryData(id);
	}
};

// 提交
const onSubmit = async () => {
	const valid = await dataFormRef.value.validate().catch(() => {});
	if (!valid) return false;

	try {
		loading.value = true;
		form.id ? await putObj(form) : await addObj(form);
		useMessage().success(form.id ? t('common.editSuccessText') : t('common.addSuccessText'));
		visible.value = false;
		emit('refresh');
	} catch (err: any) {
		useMessage().error(err.msg);
	} finally {
		loading.value = false;
	}
};

// 初始化表单数据
const getCategoryData = (id: string) => {
	loading.value = true;
	getObj({ id: id })
		.then((res: any) => {
			Object.assign(form, res.data[0]);
		})
		.finally(() => {
			loading.value = false;
		});
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>
