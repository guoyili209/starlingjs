const gulp = require('gulp');
const clean = require('gulp-clean');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const webpack = require('webpack-stream');
const named = require('vinyl-named'); //
const jshint = require("gulp-jshint");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");

gulp.task('clean', function () {
    return gulp.src('bin/dist')
        .pipe(clean())
        .pipe(gulp.src('bin/js'))
        .pipe(clean());
});

gulp.task("tscompile", function () {
    return tsProject.src()
      .pipe(tsProject())
      .js.pipe(gulp.dest("bin/js"));
  });

gulp.task('babel', function () {
    return gulp.src('bin/js/**/*.js')
        // .pipe(jshint())
        .pipe(jshint.reporter())
        .pipe(babel())
        .pipe(gulp.dest('bin/dist'))
    // .pipe(uglify())
});

gulp.task('merge', function () {
    return gulp.src('bin/dist/**/*.js')
        .pipe(named())
        .pipe(webpack())
        .pipe(concat('index.js'))
        .pipe(gulp.dest('./bin/dist/merge'))
})

gulp.task('default',gulp.series('clean','tscompile','babel','merge'));