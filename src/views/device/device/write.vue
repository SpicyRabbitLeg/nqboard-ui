<template>
	<div class="layout-padding">
		<splitpanes>
			<pane size="20" class="ml10">
				<div class="layout-padding-auto layout-padding-view">
					<el-row>
						<div class="mb8" style="width: 100%">
							<div class="sidebar-header">
								<el-icon class="sidebar-icon">
									<List />
								</el-icon>
								<span>设备列表</span>
							</div>
						</div>
					</el-row>
					<el-scrollbar>
						<query-tree
							:placeholder="$t('device.inputDeviceNameTip')"
							:query="deviceTree.queryList"
							:show-expand="true"
							@node-click="handleNodeClick"
						/>
					</el-scrollbar>
				</div>
			</pane>
			<pane size="80" class="ml8">
				<div class="layout-padding-auto layout-padding-view">
					<div class="content-header">
						<div class="header-info">
							<h2>设备参数写入</h2>
							<p>选择左侧设备后，配置参数并执行写入操作</p>
						</div>
						<div class="header-actions" v-if="formItems.length > 0">
							<el-tag :type="formData.deviceId ? 'success' : 'info'">
								{{ formData.deviceId ? `设备ID: ${formData.deviceId}` : '请选择设备' }}
							</el-tag>
						</div>
					</div>

					<div class="form-wrapper" v-if="formItems.length > 0">
						<el-form :model="formData" ref="formRef" label-width="auto" label-position="top" class="write-form">
							<el-form-item label="deviceId" prop="deviceId" style="display: none;">
								<el-input v-model="formData.deviceId" />
							</el-form-item>

							<el-row :gutter="24" class="form-grid">
								<el-col :span="6" v-for="item in formItems" :key="item.id">
									<el-card class="param-card" shadow="hover">
										<div class="param-header">
											<div class="param-title">
												<span class="param-name">{{ item.name }}</span>
												<el-tag size="small" type="info" v-if="item.dataType">
													{{ item.dataType }}
												</el-tag>
											</div>
											<div class="param-unit" v-if="item.unit">
												{{ item.unit }}
											</div>
										</div>

										<div class="param-control">
											<el-switch v-if="item.dataType === 'bool'" v-model="formData[item.identifier]" active-text="开启" inactive-text="关闭" size="large" />
											<el-input-number
												v-else-if="['int', 'long', 'float', 'double', 'short'].includes(item.dataType)"
												v-model="formData[item.identifier]"
												:placeholder="`请输入${item.name}`"
												style="width: 100%"
												:precision="['float', 'double'].includes(item.dataType) ? 2 : 0"
											/>
											<el-input v-else v-model="formData[item.identifier]" :placeholder="`请输入${item.name}`" clearable />
										</div>

										<div class="param-desc" v-if="item.remark">
											<el-icon class="desc-icon">
												<InfoFilled />
											</el-icon>
											{{ item.remark }}
										</div>
									</el-card>
								</el-col>
							</el-row>

							<div class="form-footer">
								<el-button type="primary" size="large" @click="submitForm" :loading="submitLoading" :disabled="!formData.deviceId">
									<el-icon>
										<Upload />
										</el-icon>
										执行写入
									</el-button>
									<el-button size="large" @click="resetForm" :disabled="!formData.deviceId">
										<el-icon>
											<RefreshLeft />
											</el-icon>
											重置参数
										</el-button>
								</div>
						</el-form>
					</div>

					<!-- 空状态 -->
					<el-empty v-else description="请从左侧设备列表中选择一个设备" :image-size="120" class="empty-state">
						<template #image>
							<el-icon class="empty-icon">
								<Monitor />
							</el-icon>
						</template>
					</el-empty>
				</div>
			</pane>
		</splitpanes>
	</div>
</template>

<script setup lang="ts" name="deviceWrite">
import { useDict } from '/@/hooks/dict';
import { useI18n } from 'vue-i18n';
import { useMessage, useMessageBox } from "/@/hooks/message";
import { getDeviceByGroup, writeDeviceData } from "/@/api/device/device";
import { getModelByProduct } from '/@/api/device/model';
import { ElForm, ElButton, ElInput, ElFormItem } from 'element-plus';
import { Upload, RefreshLeft, List, InfoFilled, Monitor } from '@element-plus/icons-vue';



// 使用国际化插件
const { t } = useI18n();

// 动态引入组件
const QueryTree = defineAsyncComponent(() => import('/@/components/QueryTree/index.vue'));

// 模型列表
const pointList = ref([]) as any;
// 表单引用
const formRef = ref<InstanceType<typeof ElForm> | null>(null);
// 消息提示
const message = useMessage();
// 表单项
const formItems = computed(() => pointList.value);
// 提交状态
const submitLoading = ref(false);

// 动态生成表单数据
const formData = reactive({
    deviceId: '',
    ...pointList.value.reduce((acc: any, item: any) => {
        acc[item.identifier] = item.baseValue || '';
        return acc;
    }, {} as Record<string, string | number>)
});

// 设备树使用的数据
const deviceTree = reactive({
    queryList: (name: String) => {
        return getDeviceByGroup({
            name: name,
        });
    },
});

// 点击树
const handleNodeClick = (currentNode: any, node: any, treeNode: any, event: any) => {
    if (currentNode.children && currentNode.children.length > 0) {
        return;
    }

    // 查询端点设备
    getModelList(currentNode.parentId, currentNode.id);
};


/**
 * 查询当前设备的模型列表
 */
const getModelList = async (productId: string, deviceId: string) => {
    try {
        const { data } = await getModelByProduct(productId, deviceId);
        formData.deviceId = data[0]?.point?.deviceId || deviceId;

        // 清空之前的数据
        pointList.value = [];
        Object.assign(pointList.value, data);

        // 初始化表单数据
        data.forEach((item: any) => {
            if (item.identifier) {
                formData[item.identifier] = item.baseValue || '';
            }
        });
    } catch (err: any) {
        useMessage().error(err.msg);
    }
}

/**
 * 自动选择第一个有子节点的设备
 */
const autoSelectFirstDevice = async () => {
    try {
        // 稍作延迟，确保组件完全加载
        await nextTick();

        // 获取设备组数据
        const { data } = await getDeviceByGroup({});

        if (data && data.length > 0) {
            // 查找第一个有子节点的设备组
            for (const group of data) {
                if (group.children && group.children.length > 0) {
                    // 选择第一个子设备
                    const firstDevice = group.children[0];
                    console.log('自动选择设备:', group.name, '->', firstDevice.name);
                    await getModelList(group.id, firstDevice.id);
                    break;
                }
            }
        }
    } catch (err: any) {
        console.error('自动选择设备失败:', err);
    }
}

// 提交表单
const submitForm = async () => {
    if (!formData.deviceId) {
        message.error('请先选择设备');
        return;
    }

    try {
        submitLoading.value = true;

        // 构建写入数据和数据类型
        const writeData: any = {};
        const dataTypes: any = {};

        formItems.value.forEach((item: any) => {
            if (item.identifier && formData[item.identifier] !== undefined && formData[item.identifier] !== '') {
                writeData[item.identifier] = formData[item.identifier];
                dataTypes[item.identifier] = item.dataType;
            }
        });

        if (Object.keys(writeData).length === 0) {
            message.warning('请至少填写一个参数');
            return;
        }

        const requestData = {
            deviceId: formData.deviceId,
            data: writeData,
            dataTypes: dataTypes,
            description: '设备参数写入操作'
        };

        console.log('写入设备数据:', requestData);

        // 调用设备写入API
        const { data } = await writeDeviceData(requestData);

        message.success('设备参数写入成功');

    } catch (error: any) {
        console.error('写入失败:', error);
        message.error(error.message || '设备参数写入失败');
    } finally {
        submitLoading.value = false;
    }
};

// 重置表单
const resetForm = () => {
    formRef.value?.resetFields();
    message.info('表单已重置');
};

// 页面挂载时自动选择第一个设备
onMounted(() => {
    autoSelectFirstDevice();
});
</script>

<style scoped lang="scss">
.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fafbfc;
  .sidebar-icon {
    font-size: 18px;
    color: #409eff;
  }
  span {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.content-header {
  padding: 24px 32px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .header-info {
    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }
  .header-actions {
    .el-tag {
      font-size: 13px;
      height: 32px;
      line-height: 30px;
      padding: 0 16px;
      border-radius: 16px;
    }
  }
}

.form-wrapper {
  flex: 1;
  padding: 32px;
  overflow: auto;
}

.write-form {
  max-width: 1200px;
  margin: 0 auto;
}

.write-form .form-grid {
  margin-bottom: 40px;
}

.param-card {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  }
  :deep(.el-card__body) {
    padding: 20px;
  }
  .param-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    .param-title {
      display: flex;
      align-items: center;
      gap: 8px;
      .param-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
    .param-unit {
      color: #909399;
      font-size: 14px;
      background: #f0f2f5;
      padding: 4px 12px;
      border-radius: 12px;
    }
  }
  .param-control {
    margin-bottom: 12px;
    .el-switch {
      --el-switch-on-color: #67c23a;
      --el-switch-off-color: #dcdfe6;
      :deep(.el-switch__label) {
        font-size: 14px;
        font-weight: 500;
      }
    }
    .el-input,
    .el-input-number {
      :deep(.el-input__wrapper) {
        border-radius: 6px;
        transition: all 0.3s ease;
        &:hover {
          border-color: #409eff;
        }
        &.is-focus {
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
      }
    }
  }
  .param-desc {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
    .desc-icon {
      color: #909399;
      margin-top: 1px;
      flex-shrink: 0;
    }
  }
}

.form-footer {
  text-align: center;
  padding: 32px 0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fff;
  .empty-icon {
    font-size: 120px;
    color: #c0c4cc;
    margin-bottom: 20px;
  }
  :deep(.el-empty__description) {
    color: #909399;
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .content-header {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .form-wrapper {
    padding: 20px;
    .write-form .form-grid {
      .el-col {
        width: 100%;
      }
    }
    .form-footer .el-button {
      width: 100%;
      margin: 8px 0;
    }
  }
}
</style>