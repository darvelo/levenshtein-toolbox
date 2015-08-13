var gulp = require('gulp');
var del = require('del');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');

// dir vars
var src = 'lib/levenshtein.js';
var dest = 'dest/';

// tasks
gulp.task('clean', function(cb) {
    del(dest, cb);
});

gulp.task('build:global', ['clean'], function() {
    return gulp.src(src)
        .pipe(babel({
            modules: 'ignore',
            experimental: 2,
        }))
        .on('error', function (err) { console.error(err.toString()); this.emit('end'); })
        .pipe(rename({suffix:'.global'}))
        .pipe(gulp.dest(dest))
        .pipe(uglify())
        .pipe(rename({suffix:'.min'}))
        .pipe(gulp.dest(dest));
});

gulp.task('build:amd', ['clean'], function() {
    return gulp.src(src)
        .pipe(babel({
            modules: 'amd',
            moduleIds: true,
            sourceRoot: __dirname + '/js',
            moduleRoot: null,
            experimental: 2,
        }))
        .on('error', function (err) { console.error(err.toString()); this.emit('end'); })
        .pipe(rename({suffix:'.amd'}))
        .pipe(gulp.dest(dest))
        .pipe(uglify())
        .pipe(rename({suffix:'.min'}))
        .pipe(gulp.dest(dest));
});

gulp.task('build:commonjs', ['clean'], function() {
    return gulp.src(src)
        .pipe(babel({
            modules: 'common',
            experimental: 2,
        }))
        .on('error', function (err) { console.error(err.toString()); this.emit('end'); })
        .pipe(rename({suffix:'.commonjs'}))
        .pipe(gulp.dest(dest))
        .pipe(uglify())
        .pipe(rename({suffix:'.min'}))
        .pipe(gulp.dest(dest));
});

gulp.task('default', ['build:global', 'build:amd', 'build:commonjs']);
