const { src, dest, parallel } = require('gulp');

function buildIcons() {
	return src('nodes/CashfreePayments/*.{png,svg}')
		.pipe(dest('dist/nodes/CashfreePayments/'));
}

function copyPackageFiles() {
	return src(['package.json', 'LICENSE.md', 'README.md'])
		.pipe(dest('dist/'));
}

exports['build:icons'] = buildIcons;
exports['build:copy'] = copyPackageFiles;
exports['build:post'] = parallel(buildIcons, copyPackageFiles);
