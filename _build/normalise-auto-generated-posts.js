var fs = require('fs');
var program = require('commander');
//var S = require('string');
//var $ = require('jquery');

var ncp = require('ncp').ncp;

//var file = __dirname + '/../_local_data/errors/html-validation/errors.json';
//var posts_directory = __dirname + '/../_posts/errors/html-validation';
//var templates_directory = __dirname + '/../_templates/errors/html-validation';
//var includes_directory = __dirname + '/../_includes/generated/html-validation';
//var includes_base_directory = __dirname + '/../_includes';
//
//var TEMPLATE_TEMPLATE = 'template_default';
//var POST_TEMPLATE = 'post_default';
//var INDEX_TEMPLATE = 'index';
//var MAX_FILE_NAME_LENGTH = 220;
//var DEFAULT_TEMPLATE_POST_TIMEPSTAMP = '2013-07-27';

var auto_generated_posts_source_directory = __dirname + '/../_posts/errors/html-validation/auto-generated';
var auto_generated_posts_destination_directory = __dirname + '/../_posts/errors/html-validation';

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

program
    .option('-n, --noparams', 'Process parameterless errors only')
    .option('-p, --params', 'Process parametered errors only')
    .option('-c, --countmin [number]', 'Minimum error count to be considered', 0)
    .parse(process.argv);

//ncp.limit = 16;
//
//ncp(auto_generated_posts_source_directory, auto_generated_posts_destination_directory, function (err) {
//    if (err) {
//        return console.error(err);
//    }
//    console.log('done!');
//});
//
//console.log(auto_generated_posts_source_directory, auto_generated_posts_destination_directory);
