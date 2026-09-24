<template>
	<el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible" :close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="form" :rules="dataRules" label-width="120px" v-loading="loading">
			<el-form-item :label="$t('expert.subjectCategory')" prop="subjectCategory">
				<el-input :placeholder="$t('expert.inputSubjectCategoryTip')" v-model="form.subjectCategory" />
			</el-form-item>

			<el-form-item :label="$t('expert.firstDiscipline')" prop="firstDiscipline">
				<el-input :placeholder="$t('expert.inputFirstDisciplineTip')" v-model="form.firstDiscipline" />
			</el-form-item>

			<el-form-item :label="$t('expert.secondDiscipline')" prop="secondDiscipline">
				<el-input :placeholder="$t('expert.inputSecondDisciplineTip')" v-model="form.secondDiscipline" />
			</el-form-item>

			<el-form-item :label="$t('expert.researchDirection')" prop="researchDirection">
				<el-input
					:placeholder="$t('expert.inputResearchDirectionTip')"
					type="textarea"
					show-word-limit
					maxlength="255"
					:autosize="{ minRows: 2, maxRows: 4 }"
					v-model="form.researchDirection"
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

<script setup lang="ts" name="expertDialog">
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj } from '/@/api/export/expert';
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
	subjectCategory: '',
	firstDiscipline: '',
	secondDiscipline: '',
	researchDirection: '',
});

// 定义校验规则
const dataRules = ref({
	subjectCategory: [{ required: true, message: '学科门类不能为空', trigger: 'blur' }],
	firstDiscipline: [{ required: true, message: '一级学科不能为空', trigger: 'blur' }],
});

// 打开弹窗
const openDialog = (id: string) => {
	visible.value = true;
	form.id = '';

	// 重置表单数据
	nextTick(() => {
		dataFormRef.value?.resetFields();
	});

	// 获取专家信息
	if (id) {
		form.id = id;
		getExpertData(id);
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
const getExpertData = (id: string) => {
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
