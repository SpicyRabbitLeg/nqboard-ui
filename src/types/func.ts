// 定义全局属性的类型
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { ComponentCustomProperties } from 'vue';
import { VueI18n } from 'vue-i18n';

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		parseTime: Function;
		parseDate: Function;
		dateTimeStr: string;
		dateStr: string;
		timeStr: string;
		baseURL: string;
		$t: VueI18n['t'];
	}
}
