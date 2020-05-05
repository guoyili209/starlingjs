const gulp = require('gulp');
const clean = require('gulp-clean');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const webpack = require('webpack-stream');
const named = require('vinyl-named'); //
const jshint = require("gulp-jshint");
gulp.task('clean', function () {
    return gulp.src('bin')
        .pipe(clean());
});

gulp.task('babel', function () {
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter())
        .pipe(babel())
        .pipe(gulp.dest('bin'))
    // .pipe(uglify())
});

gulp.task('merge', function () {
    return gulp.src('bin/**/*.js')
        .pipe(named())
        .pipe(webpack())
        .pipe(concat('index.js'))
        .pipe(gulp.dest('./bin/merge'))
})

gulp.task('default',gulp.series('clean','babel','merge'));