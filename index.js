const path = require('path');
const log = require('fancy-log');
const chalk = require('chalk');
const through = require('through2');
const mime = require('mime');
const OSS = require('ali-oss');
const PluginError = require('gulp-util').PluginError;

const PLUGIN_NAME = 'gulp-ali-oss-upload';

async function main(opts) {

    if(!opts.ossConfig){
        throw new PluginError(PLUGIN_NAME, 'ossConfig is required');
    }

    let failList = [];

    const oss = new OSS({
        accessKeyId: opts.ossConfig.accessKeyId,
        accessKeySecret: opts.ossConfig.accessKeySecret,
        endpoint: opts.ossConfig.endpoint,
        bucket: opts.ossConfig.bucket
    });
    const headers = {
        'Cache-Control': 'max-age=' + 3600 * 1,
        mime: mime.getType(uploadPath),
        ...(opts.headers ? opts.headers : {})
    };

    // if (opts.clean) {
    //     // 删除 指定的 oss 文件 或目录
    //     try {
    //         await client.deleteMulti(['obj-1', 'obj-2', 'obj-3']);
    //         console.log(result);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    return through.obj(function (file, enc, next) {
        if (!file.isBuffer()) {
            next();
            return;
        }
        const uploadPath = path.relative(file.base, file.path);
        oss
            .put(uploadPath, file.contents, {headers})
            .then(function (res) {
                log(chalk.green('success'), ++count, uploadPath);
                next();
            })
            .catch(err => {
                failList.push(file.path);
                log(chalk.red('fail'), ++count, uploadPath);
                log(err);
                next();
            });
    })
}

module.exports = main;