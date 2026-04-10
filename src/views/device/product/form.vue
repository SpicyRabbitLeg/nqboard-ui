<template>
	<el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible"
		:close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="form" :rules="dataRules" formDialogRef label-width="120px"
			v-loading="loading">
			<el-row :gutter="24">
				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('product.name')" prop="name">
						<el-input v-model="form.name" :placeholder="$t('product.inputNameTip')" />
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('product.identifier')" prop="identifier">
						<el-input v-model="form.identifier" :placeholder="$t('product.inputIdentifierTip')">
							<template #append>
								<el-button @click="identification()" type="info">识别</el-button>
							</template>
						</el-input>
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('product.protocol')" prop="protocol">
						<el-select v-model="form.protocol" :placeholder="$t('product.inputProtocolTip')"
							style="width: 240px">
							<el-option v-for="(item, index) in protocol" :key="index" :label="item.label"
								:value="item.value"></el-option>
						</el-select>
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('product.authSwitch')" prop="authSwitch">
						<el-switch v-model="form.authSwitch" />
					</el-form-item>
				</el-col>

				<el-col v-if="form.authSwitch === true" :span="12" class="mb20">
					<el-form-item :label="$t('product.authMode')" prop="authMode">
						<el-radio-group v-model="form.authMode">
							<el-radio value="0" border>{{ $t('product.easy') }}</el-radio>
							<el-radio value="1" border>{{ $t('product.encipher') }}</el-radio>
						</el-radio-group>
					</el-form-item>
				</el-col>

				<el-col v-if="form.protocol === 'RTSP'" :span="24" class="mb20">
					<el-form-item :label="$t('product.cammerTypes')" prop="cameraTypesArray">
						<el-checkbox-group v-model="form.cameraTypesArray">
							<el-checkbox v-for="(item, index) in ai_cammer_type" :key="index" :label="item.value"
								border>
								{{ item.label }}
							</el-checkbox>
						</el-checkbox-group>
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('product.categoryId')" prop="categoryId">
						<el-select v-model="form.categoryId" :placeholder="$t('product.inputCategoryIdTip')">
							<el-option v-for="(item, index) in categoryInfo.list" :key="index" :label="item.label"
								:value="item.value"></el-option>
						</el-select>
					</el-form-item>
				</el-col>

				<el-col :span="12" class="mb20">
					<el-form-item :label="$t('product.orderNum')" prop="orderNum">
						<el-input-number :min="1" v-model="form.orderNum" :placeholder="$t('product.inputOrderNumTip')"
							controls-position="right" />
					</el-form-item>
				</el-col>

				<el-col :span="24" class="mb20">
					<el-form-item :label="$t('product.image')" prop="img">
						<ImageUpload v-model="form.img"/>
					</el-form-item>
				</el-col>

				<el-col :span="24" class="mb20">
					<el-form-item :label="$t('product.remark')" prop="remark">
						<el-input v-model="form.remark" type="textarea" :placeholder="$t('product.inputRemarkTip')"
							:autosize="{ minRows: 2, maxRows: 4 }" />
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

<script setup lang="ts" name="productDialog">
import { useDict } from '/@/hooks/dict';
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj, getPingYing } from '/@/api/device/product';
import { useI18n } from 'vue-i18n';

// 组件
const ImageUpload = defineAsyncComponent(() => import('/@/components/Upload/Image.vue'));

// 使用国际化插件
const { t } = useI18n();

const emit = defineEmits(['refresh']);

// 定义 props，使用正确的类型声明
interface CategoryItem {
	label: string;
	value: number | string;
}
const categoryInfo = defineProps<{
	list: CategoryItem[];
}>();

// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);

// 定义字典
const { protocol, ai_cammer_type } = useDict('protocol', 'ai_cammer_type');

// 提交表单数据
const form = reactive({
	id: '',
	orderNum: 1,
	categoryId: '',
	name: '',
	identifier: '',
	remark: '',
	protocol: '',
	authSwitch: false,
	authMode: '',
	img: '',
	cameraTypes: '',
	cameraTypesArray: [],
});

/**
 * 校验产品标识唯一
 */
const checkIdentifierUnique = (rule: any, value: any, callback: any) => {
	if (!value) {
		callback();
		return;
	}

	getObj({ identifier: form.identifier })
		.then((res: any) => {
			if (res.data && res.data.length >= 1) {
				callback(new Error('产品标识已存在，请输入其他值'));
			} else {
				callback();
			}
		})
		.catch(() => {
			callback(new Error('校验失败,请稍后重试'))
		})
}

// 定义校验规则
const dataRules = ref({
	name: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
	identifier: [
		{ required: true, message: '产品标识不能为空', trigger: 'blur' },
		{ validator: checkIdentifierUnique, trigger: 'blur' },
	],
	protocol: [{ required: true, message: '协议不能为空', trigger: 'blur' }],
	categoryId: [{ required: true, message: '产品分类不能为空', trigger: 'blur' }]
});




// 打开弹窗
const openDialog = (id: string, categoryInfo: any) => {
	visible.value = true;
	form.id = '';

	// 重置表单数据
	nextTick(() => {
		dataFormRef.value?.resetFields();
	});

	// 获取iotProduct信息
	if (id) {
		form.id = id;
		getIotProductData(id);
	}

	// 获取categoryInfo信息
	if (categoryInfo) {
		categoryInfo.value = categoryInfo;
	}
};

// 提交
const onSubmit = async () => {
	const valid = await dataFormRef.value.validate().catch(() => { });
	if (!valid) return false;

	try {
		loading.value = true;

		if (form.cameraTypesArray) {
			form.cameraTypes = JSON.stringify(form.cameraTypesArray)
		}
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
const getIotProductData = (id: string) => {
	// 获取数据
	loading.value = true;
	getObj({ id: id })
		.then((res: any) => {
			Object.assign(form, res.data[0]);
		})
		.finally(() => {
			loading.value = false;
		});
};

/**
 * 根据name识别转拼音
 */
const identification = () => {
	getPingYing(form.name)
		.then((res: any) => {
			form.identifier = res.data;
		})
}

// 暴露变量
defineExpose({
	openDialog,
});
</script>