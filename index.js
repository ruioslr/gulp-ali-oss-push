const path = require('path');
const log = require('fancy-log');
const chalk = require('chalk');
const through = require('through2');
const mime = require('mime');
const OSS = require('ali-oss');
const PluginError = require('gulp-util').PluginError;

const PLUGIN_NAME = 'gulp-ali-oss-upload';

function main(opts) {

    if (!opts.ossConfig) {
        throw new PluginError(PLUGIN_NAME, 'ossConfig is required');
    }

    let failList = [];
    let count = 0;
    let retryTimes = 0;

    const oss = new OSS({
        accessKeyId: opts.ossConfig.accessKeyId,
        accessKeySecret: opts.ossConfig.accessKeySecret,
        endpoint: opts.ossConfig.endpoint,
        bucket: opts.ossConfig.bucket
    });

    // if (opts.clean) {
    //     // 删除 指定的 oss 文件 或目录
    //     try {
    //         await client.deleteMulti(['obj-1', 'obj-2', 'obj-3']);
    //         console.log(result);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }


    const stream = through.obj(function (file, enc, next) {
        if (!file.isBuffer()) {
            next();
            return;
        }
        const uploadPath = path.relative(file.base, file.path);
        const headers = {
            'Cache-Control': 'max-age=' + 3600 * 1,
            mime: mime.getType(uploadPath),
            ...(opts.headers ? opts.headers : {})
        };
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
    });

    stream.on('end', function () {
        if (failList.length) {
            log(
                chalk.red('Deploy oss files failed:'),
                '\n' + failList.join('\n')
            );
            // retry 3 times at most
            if (retryTimes < 3) {
                retryTimes++;
                log(chalk.red('Retry deploy oss time ' + retryTimes + '...'));
                // TODO implents retry
            } else {
                log(chalk.red('Deploy oss failed!'));
            }
        }else{
            log(chalk.green('Deploy oss success!'));
        }
    });


    return stream;

}

module.exports = main;