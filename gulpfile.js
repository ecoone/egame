/**
 * egame自动化脚本
 */
var gulp = require('gulp');
var jsdoc = require('gulp-jsdoc3');

gulp.task('doc', function (cb) {
    var config = require('./jsdoc.json');
    gulp.src(['README.md', './src/**/*.js'], {read: false})
        .pipe(jsdoc(config, cb));
});


// gulp.task('doc', function (cb) {
//     gulp.src(['README.md', './src/**/*.js'], {read: false})
//         .pipe(jsdoc(cb));
// });