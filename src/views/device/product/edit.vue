<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row :gutter="24">
				<el-col :span="1" class="mb20">
					<router-link to="/device/product/index"><el-button>{{ $t('product.back')
					}}</el-button></router-link>
				</el-col>
				<el-col :span="4" class="mb20 productName">
					<span>{{ $t('product.name') }}：{{ product.name }}</span>
				</el-col>
				<el-col :span="4" class="mb20 productName">
					<span>{{ $t('product.update') }}：<el-button @click="onSubmit" type="primary" text='primary'>{{
						$t('product.doUpdate') }}</el-button></span>
				</el-col>
			</el-row>



			<el-tabs v-model="activeName" class="demo-tabs">
				<el-tab-pane :label="$t('product.baseInfo')" name="base_info">
					<el-form ref="dataFormRef" :model="product" :rules="dataRules" formDialogRef label-width="120px"
						v-loading="loading">
						<el-row :gutter="24">
							<el-col :span="8" class="mb20">
								<el-form-item :label="$t('product.name')" prop="name">
									<el-input v-model="product.name" :placeholder="$t('product.inputNameTip')" />
								</el-form-item>

								<el-form-item :label="$t('product.authSwitch')" prop="authSwitch">
									<el-switch v-model="product.authSwitch" />
								</el-form-item>

								<el-form-item :label="$t('product.orderNum')" prop="orderNum">
									<el-input-number :min="1" v-model="product.orderNum"
										:placeholder="$t('product.inputOrderNumTip')" controls-position="right" />
								</el-form-item>

								<el-form-item v-if="product.protocol == 'RTSP'" :label="$t('product.cammerTypes')" prop="cameraTypesArray">
									<el-checkbox-group v-model="product.cameraTypesArray">
										<el-checkbox v-for="item in ai_cammer_type" :key="item.value"
											:value="item.value" border>
											{{ item.label }}
										</el-checkbox>
									</el-checkbox-group>
								</el-form-item>

								<el-form-item :label="$t('product.remark')" prop="remark">
									<el-input v-model="product.remark" type="textarea"
										:placeholder="$t('product.inputRemarkTip')"
										:autosize="{ minRows: 2, maxRows: 4 }" />
								</el-form-item>
							</el-col>
							<el-col :span="8" class="mb20">
								<el-form-item :label="$t('product.protocol')" prop="protocol">
									<el-select v-model="product.protocol" :placeholder="$t('product.inputProtocolTip')"
										style="width: 240px">
										<el-option v-for="(item, index) in protocol" :key="index" :label="item.label"
											:value="item.value"></el-option>
									</el-select>
									<el-input v-model="product.protocolValue" style="display: none"></el-input>
								</el-form-item>

								<el-col v-if="product.authSwitch === true" class="mb20">
									<el-form-item :label="$t('product.authMode')" prop="authMode">
										<el-radio-group v-model="product.authMode">
											<el-radio value="0" border>{{ $t('product.easy') }}</el-radio>
											<el-radio value="1" border>{{ $t('product.encipher') }}</el-radio>
										</el-radio-group>
									</el-form-item>
								</el-col>

								<el-form-item :label="$t('product.categoryId')" prop="categoryId">
									<el-select v-model="product.categoryId"
										:placeholder="$t('product.inputCategoryIdTip')">
										<el-option v-for="(item, index) in categoryInfo" :key="index"
											:label="item.label" :value="item.value"></el-option>
									</el-select>
								</el-form-item>
							</el-col>
							<el-col :span="1" class="mb20"></el-col>
							<el-col :span="7" class="mb20">
								<el-form-item :label="$t('product.image')" prop="img">
									<ImageUpload v-model="product.img" />
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>

				</el-tab-pane>

				<el-tab-pane :label="$t('product.productModel')" name="product_model">
					<Model />
				</el-tab-pane>

				<el-tab-pane :label="$t('product.deviceAuth')" name="device_auth">
					<h1>设备授权</h1>
				</el-tab-pane>
			</el-tabs>
		</div>
	</div>
</template>

<script setup lang="ts" name="productEdit">
import '/@/theme/product.scss';
import { useDict } from '/@/hooks/dict';
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
import { getById, putObj } from '/@/api/device/product';
import { getDetails } from '/@/api/device/category';

// 组件
const ImageUpload = defineAsyncComponent(() => import('/@/components/Upload/Image.vue'));
const Model = defineAsyncComponent(() => import('/@/views/device/model/index.vue'));

// 使用国际化插件
const { t } = useI18n();

// 定义变量内容
const route = useRoute();
const loading = ref(false);
const dataFormRef = ref();

// 定义字典
const { protocol, ai_cammer_type } = useDict('protocol', 'ai_cammer_type');

// 产品详情
const product = ref({
	id: '',
	orderNum: 1,
	categoryId: '',
	name: '',
	remark: '',
	protocol: '',
	protocolValue: '',
	authSwitch: false,
	authMode: '',
	img: '',
	cameraTypes: '',
	cameraTypesArray: [],
});

// 定义校验规则
const dataRules = ref({
	name: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
	protocol: [{ required: true, message: '协议不能为空', trigger: 'blur' }],
	categoryId: [{ required: true, message: '产品分类不能为空', trigger: 'blur' }]
});

// 产品分类
const categoryInfo = ref([{ label: "", value: "" }]);


// 在页面加载前调用接口
onMounted(() => {
	// 获取产品详情
	getById(String(route.query.id))
		.then(resp => {
			product.value = resp.data;
			if (product.value.cameraTypes) {
				product.value.cameraTypesArray = JSON.parse(product.value.cameraTypes);
			}
		})
		.catch(error => console.error('获取产品信息失败:', error));

	// 获取产品分类
	getDetails().then(resp => {
		categoryInfo.value = resp.data.map((item: any) => {
			return { label: item.name, value: item.id };
		});
	}).catch(error => console.error('获取产品分类信息失败:', error));
});

// 默认项
const activeName = ref('base_info');

// 提交
const onSubmit = async () => {
	const valid = await dataFormRef.value.validate().catch(() => { });
	if (!valid) return false;

	try {
		loading.value = true;
		if (product.value.cameraTypesArray) {
			product.value.cameraTypes = JSON.stringify(product.value.cameraTypesArray);
		}
		await putObj(product.value);
		useMessage().success(t('common.editSuccessText'));
	} catch (err: any) {
		useMessage().error(err.msg);
	} finally {
		loading.value = false;
	}
};
</script>
