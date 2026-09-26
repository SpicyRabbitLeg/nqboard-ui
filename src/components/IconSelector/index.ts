import { readFileSync, readdirSync } from 'fs';

let idPerfix = '';
const iconNames: string[] = [];
const svgTitle = /<svg([^>+].*?)>/;
const clearHeightWidth = /(width|height)="([^>+].*?)"/g;
const hasViewBox = /(viewBox="[^>+].*?")/g;
const clearReturn = /(\r)|(\n)/g;
// 清理 svg 的 fill
const clearFill = /(fill="[^>+].*?")/g;

function findSvgFile(dir: string): string[] {
	const svgRes = [] as any;
	const dirents = readdirSync(dir, {
		withFileTypes: true,
	});
	for (const dirent of dirents) {
		if (dirent.isDirectory()) {
			svgRes.push(...findSvgFile(dir + dirent.name + '/'));
			continue;
		}
		// 目录中混入的非 svg 文件（如图片）若被读入，二进制内容会注入页面形成乱码
		if (!dirent.name.endsWith('.svg')) continue;
		iconNames.push(`${idPerfix}-${dirent.name.replace('.svg', '')}`);
		const svg = readFileSync(dir + dirent.name)
			.toString()
			.replace(clearReturn, '')
			.replace(clearFill, 'fill=""')
			.replace(svgTitle, ($1, $2) => {
				let width = 0;
				let height = 0;
				let content = $2.replace(clearHeightWidth, (s1: string, s2: string, s3: number) => {
					if (s2 === 'width') {
						width = s3;
					} else if (s2 === 'height') {
						height = s3;
					}
					return '';
				});
				if (!hasViewBox.test($2)) {
					content += `viewBox="0 0 ${width} ${height}"`;
				}
				return `<symbol id="${idPerfix}-${dirent.name.replace('.svg', '')}" ${content}>`;
			})
			.replace('</svg>', '</symbol>');
		svgRes.push(svg);
	}
	return svgRes;
}

export const svgBuilder = (path: string, perfix = 'local') => {
	if (path === '') return;
	idPerfix = perfix;
	const res = findSvgFile(path);
	return {
		name: 'svg-transform',
		transformIndexHtml(html: string) {
			/* eslint-disable */
			return html.replace(
				'<body>',
				`
                <body>
                <svg id="local-icon" data-icon-name="${iconNames.join(
									','
								)}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position: absolute; width: 0; height: 0">
                ${res.join('')}
                </svg>
                `
			);
			/* eslint-enable */
		},
	};
};
