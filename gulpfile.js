const { src, dest, series, watch } = require("gulp");
const { readFileSync } = require("fs");
const autoprefixer = require("gulp-autoprefixer");
const del = require("del");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass")(require("sass"));
const fileInclude = require("gulp-file-include");
const rev = require("gulp-rev");
const revRewrite = require("gulp-rev-rewrite");
const revDel = require("gulp-rev-delete-original");
const notify = require("gulp-notify");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");

const clean = () => {
	return del(["dist/**/*.*"], { force: true });
};

const stylesBackend = () => {
	return src("./src/scss/**/*.scss")
		.pipe(sass().on("error", notify.onError()))
		.pipe(
			autoprefixer({
				cascade: false,
			}),
		)
		.pipe(dest("./dist/css/"))
		.pipe(browserSync.stream());
};

const scriptsBackend = () => {
	return src([
		"./src/js/functions/**.js",
		"./src/js/components/**.js",
		"./src/js/*.js",
	])
		.pipe(dest("./dist/js"))
		.pipe(browserSync.stream());
};

const resources = () => {
	src("./src/resources/**").pipe(dest("./dist"));
	return src("./src/admin/**")
		.pipe(dest("./dist/admin"))
		.pipe(browserSync.stream());
};

const images = () => {
	const imgPaths = [
		"./src/img/*.{jpg,JPG,png,PNG,jpeg,JPEG,svg,SVG,webp,WEBP}",
		"./src/img/**/*.{jpg,JPG,png,PNG,jpeg,JPEG,svg,SVG,webp,WEBP}",
	];

	src(imgPaths)
		.pipe(webp())
		.pipe(imagemin())
		.pipe(dest("./dist/img"));

	return src(imgPaths)
		.pipe(imagemin())
		.pipe(dest("./dist/img"));
};

const htmlInclude = () => {
	const content = JSON.parse(readFileSync("./src/data/content.json", "utf8"));
	
	// Recursively update image paths to .webp so uploaded JPGs use auto-optimized versions
	const convertExtensionsToWebp = (obj) => {
		for (const key in obj) {
			if (typeof obj[key] === 'string') {
				obj[key] = obj[key].replace(/\.(jpg|jpeg|png)\b/gi, '.webp');
			} else if (typeof obj[key] === 'object' && obj[key] !== null) {
				convertExtensionsToWebp(obj[key]);
			}
		}
	};
	convertExtensionsToWebp(content);

	return src(["./src/*.html", "!./src/_*.html", "!./src/templates.html"])
		.pipe(
			fileInclude({
				prefix: "@@",
				basepath: "@file",
				context: content,
			}),
		)
		.pipe(dest("./dist"))
		.pipe(browserSync.stream());
};

const watchFiles = () => {
	browserSync.init({
		server: {
			baseDir: "./dist",
		},
		open: false,
		notify: false,
	});

	watch("./src/scss/**/*.scss", stylesBackend);
	watch("./src/js/**/*.js", scriptsBackend);
	watch("./src/partials/*.html", htmlInclude);
	watch("./src/partials/connected/*.html", htmlInclude);
	watch("./src/partials/sections/*.html", htmlInclude);
	watch("./src/data/content.json", htmlInclude);
	watch("./src/*.html", htmlInclude);
	watch("./src/resources/**", resources);
	watch("./src/img/*.{jpg,JPG,jpeg,JPEG,png,PNG,svg,SVG,webp,WEBP}", images);
	watch("./src/img/**/*.{jpg,JPG,jpeg,JPEG,png,PNG,svg,SVG,webp,WEBP}", images);
	watch("./src/img/svg/**.svg", images);
};

const cache = () => {
	return src("dist/**/*.{css,js,svg,png,jpg,jpeg,webp,woff2,woff}", {
		base: "dist",
	})
		.pipe(rev())
		.pipe(revDel())
		.pipe(dest("dist"))
		.pipe(rev.manifest("rev.json"))
		.pipe(dest("dist"));
};

const rewrite = () => {
	const manifest = readFileSync("dist/rev.json");
	src("dist/css/*.css")
		.pipe(
			revRewrite({
				manifest,
			}),
		)
		.pipe(dest("dist/css"));
	return src("dist/**/*.html")
		.pipe(
			revRewrite({
				manifest,
			}),
		)
		.pipe(dest("dist"));
};

exports.default = series(
	htmlInclude,
	scriptsBackend,
	stylesBackend,
	resources,
	images,
	watchFiles,
);

exports.cache = series(cache, rewrite);

exports.build = series(
	clean,
	htmlInclude,
	stylesBackend,
	scriptsBackend,
	resources,
	images,
);
