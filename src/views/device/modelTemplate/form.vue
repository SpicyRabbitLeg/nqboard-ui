<template>
	<el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible"
		:close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="form" :rules="dataRules" formDialogRef label-width="120px"
			v-loading="loading">
			<el-row :gutter="24">
				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('modelTemplate.name')" prop="name">
						<el-input v-model="form.name" :placeholder="$t('modelTemplate.inputNameTip')" />
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('modelTemplate.identifier')" prop="identifier">
						<el-input v-model="form.identifier" :placeholder="$t('modelTemplate.inputIdentifierTip')" >
                            <template #append>
								<el-button @click="identification()" type="info">识别</el-button>
							</template>
                        </el-input>
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('modelTemplate.dataType')" prop="dataType">
						<el-select v-model="form.dataType" :placeholder="$t('modelTemplate.inputDataTypeTip')"
							style="width: 240px">
							<el-option v-for="(item, index) in data_type" :key="index" :label="item.label"
								:value="item.value"></el-option>
						</el-select>
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('modelTemplate.type')" prop="type">
						<el-radio-group v-model="form.type">
							<el-radio v-for="(item, index) in read_write_type" :value="item.value" :key="index"
								size="large">
								{{ item.label }}
							</el-radio>
						</el-radio-group>
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('category.orderNum')" prop="orderNum">
						<el-input-number :min="1" v-model="form.orderNum" :placeholder="$t('category.inputOrderNumTip')"
							controls-position="right" />
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('modelTemplate.unit')" prop="unit">
						<el-input v-model="form.unit" :placeholder="$t('modelTemplate.inputUnitTip')" />
					</el-form-item>
				</el-col>

				<!-- 根据选择的dataType切换显示隐藏 -->
				<el-col :span="12" class="mb20" v-show="isShow()">
					<el-form-item :label="$t('modelTemplate.baseValue')" prop="baseValue">
						<el-input v-model="form.baseValue" :placeholder="$t('modelTemplate.inputBaseValueTip')" />
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20" v-show="isShow()">
					<el-form-item :label="$t('modelTemplate.proportionalCoefficient')" prop="proportionalCoefficient">
						<el-input v-model="form.proportionalCoefficient"
							:placeholder="$t('modelTemplate.inputProportionalCoefficientTip')" />
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20" v-show="isShow()">
					<el-form-item :label="$t('modelTemplate.specs')" prop="specs">
						<el-col :span="11" class="mb20">
							<el-input v-model="form.min" :placeholder="$t('modelTemplate.inputMinTip')" />
						</el-col>
						<el-col :span="2" class="mb20">
							<span class="text-gray-500">-</span>
						</el-col>
						<el-col :span="11" class="mb20">
							<el-input v-model="form.max" :placeholder="$t('modelTemplate.inputMaxTip')" />
							<el-input v-model="form.specs" style="display: none"></el-input>
						</el-col>
					</el-form-item>
				</el-col>

				<el-col :span="24" class="mb20">
					<el-form-item :label="$t('modelTemplate.remark')" prop="remark">
						<el-input v-model="form.remark" type="textarea"
							:placeholder="$t('modelTemplate.inputRemarkTip')" :autosize="{ minRows: 2, maxRows: 4 }" />
					</el-form-item>
				</el-col>
			</el-row>
		</el-form>

		<template #footer>
			<span class="dialog-footer">
				<el-button @click="visible = false">{{ $t('common.cancelButtonText') }}</el-button>
				<el-button type="primary" @click="onSubmit" :disabled="loading">{{ $t('common.confirmButtonText')
					}}</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<script setup lang="ts" name="IotModelTemplateDialog">
import { useDict } from '/@/hooks/dict';
import { useI18n } from 'vue-i18n';
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj } from '/@/api/device/modelTemplate';
import { getPingYing } from '/@/api/device/product';

// 使用国际化插件
const { t } = useI18n();

const emit = defineEmits(['refresh']);

// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);

// 定义字典
const { data_type, read_write_type } = useDict('data_type', 'read_write_type');

// 提交表单数据
const form = reactive({
	id: '',
	orderNum: '',
	name: '',
	identifier: '',
	type: '0',
	dataType: '',
	baseValue: '',
	proportionalCoefficient: '',
	remark: '',
	specs: '',
	min: 0,
	max: 0,
	unit: ''
});

// 定义校验规则
const dataRules = ref({
	name: [{ required: true, message: '模型名称不能为空', trigger: 'blur' }],
	identifier: [{ required: true, message: '模型标签不能为空', trigger: 'blur' }],
	dataType: [{ required: true, message: '数据类型不能为空', trigger: 'blur' }],
	type: [{ required: true, message: '读写类型不能为空', trigger: 'blur' }],
});

// 打开弹窗
const openDialog = (id: string) => {
	visible.value = true;
	form.id = '';

	// 重置表单数据
	nextTick(() => {
		dataFormRef.value?.resetFields();
	});

	// 获取iotModelTemplate信息
	if (id) {
		form.id = id;
		getIotModelTemplateData(id);
	}
};

// 监听form表单max、min变化提交specs
watch(
	() => [form.min, form.max],
	([newMin, newMax]) => {
		const temp = {
			min: newMin,
			max: newMax,
		};
		form.specs = JSON.stringify(temp);
	}
);

// 提交
const onSubmit = async () => {
	const valid = await dataFormRef.value.validate().catch(() => { });
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

/**
 * 是否显示
 */
const isShow = (): boolean => {
    return form.dataType == 'short' || form.dataType == 'int' || form.dataType == 'long' || form.dataType == 'float' || form.dataType == 'double';
}

/**
 * 根据name识别转拼音
 */
const identification = () => {
	getPingYing(form.name)
		.then((res: any) => {
			form.identifier = res.data;
		})
}

// 初始化表单数据
const getIotModelTemplateData = (id: string) => {
	// 获取数据
	loading.value = true;
	getObj({ id: id })
		.then((res: any) => {
			const data = res.data[0];
            Object.assign(form, data);
            if(data.specs) {
                const specs =JSON.parse(data!.specs);
                form.min = specs.min;
                form.max = specs.max;
            } else {
                form.min = 0;
                form.max = 0;
            }
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
