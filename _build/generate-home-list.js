var fs = require('fs');
var program = require('commander');
var S = require('string');
var $ = require('jquery');

var file = __dirname + '/../_local_data/errors/html-validation/errors.json';
var templates_directory = __dirname + '/../_templates/errors/html-validation';
var includes_directory = __dirname + '/../_includes/generated/html-validation';
var auto_generated_posts_directory = __dirname + '/../_auto_generated/errors/html-validation';

var TEMPLATE_TEMPLATE = 'template_default';
var POST_TEMPLATE = 'post_default';
var MAX_FILE_NAME_LENGTH = 220;
var DEFAULT_TEMPLATE_POST_TIMEPSTAMP = '2013-07-27';

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


var parent_document_parameters = {
    'No %0 element in scope but a %1 end tag seen.':['X', 'X']
};

var get_parent_document_parameters = function (error) {
    return (parent_document_parameters.hasOwnProperty(error.normal_form)) ? parent_document_parameters[error.normal_form] : [];
};

var get_placeholders = function(normal_form) {
    placeholders = normal_form.match(/%[0-9]/g);
    return placeholders ? placeholders : [];
};

var count_parameter_placeholders = function(normal_form) {
    var placeholders = get_placeholders(normal_form);
    return placeholders ? get_placeholders(normal_form).length : 0;
};

var has_placeholders = function (normal_form) {
    return count_parameter_placeholders(normal_form) > 0;
};

var get_placeholder_values = function(normal_form, parameters) {
    var start = 120;
    var placeholder_count = count_parameter_placeholders(normal_form);

    if (placeholder_count > 3) {
        start = start - placeholder_count + 3;
    }

    var placeholder_values = [];

    for (var index = start; index < start + placeholder_count; index++) {
        placeholder_values.push(String.fromCharCode(index).toUpperCase());
    }

    if (parameters !== undefined) {
        for (var parameter_index = 0; parameter_index < parameters.length; parameter_index++) {
            placeholder_values[parameter_index] = (['W', 'X', 'Y', 'Z'].indexOf(parameters[parameter_index]) === -1) ? parameters[parameter_index].toLowerCase() : parameters[parameter_index];
        }
    }

    return placeholder_values;
};

var normal_form_to_file_name = function(normal_form, parameters) {
    var replace_global = function(search, replace, subject) {
        while (subject.indexOf(search) !== -1) {
            subject = subject.replace(search, replace);
        }

        return subject;
    };

    var file_name = normal_form.toLowerCase();

    if (count_parameter_placeholders(file_name) > 0) {
        var placeholder_letters = get_placeholder_values(file_name, parameters);
        var placeholder_count = count_parameter_placeholders(file_name);
        var placeholders = get_placeholders(file_name);

        for (var placeholder_index = 0; placeholder_index < placeholder_count; placeholder_index++) {
            file_name = file_name.replace(placeholders[placeholder_index], placeholder_letters[placeholder_index]);
        }
    }

    file_name = replace_global(' ', '-', file_name);
    file_name = replace_global(',', '', file_name);
    file_name = replace_global('.', '', file_name);
    file_name = replace_global(':', '', file_name);
    file_name = replace_global(';', '', file_name);
    file_name = replace_global('"', '', file_name);
    file_name = replace_global('&amp', 'ampersand_placeholder', file_name);
    file_name = replace_global('&', 'ampersand', file_name);
    file_name = replace_global('ampersand_placeholder', 'amp', file_name);
    file_name = replace_global('(', '', file_name);
    file_name = replace_global(')', '', file_name);
    file_name = replace_global('/>', '', file_name);
    file_name = replace_global('/', '-slash', file_name);
    file_name = replace_global('--', '-', file_name);

    return file_name.toLowerCase();
};

var normal_form_to_template_form = function (normal_form) {
    var modifications = {
        '^Id ':'ID ',
        '\. use':'. Use',
        ' css ':' CSS '
    };

    var template_form = S(normal_form).humanize().s;

    var placeholders = get_placeholders(normal_form);

    for (var placeholderIndex = 0; placeholderIndex < placeholders.length; placeholderIndex++) {
        var template_placeholder = '{{'+placeholders[placeholderIndex]+'}}';
        template_form = template_form.replace(placeholders[placeholderIndex], template_placeholder);

        for (var pattern in modifications) {
            if (modifications.hasOwnProperty(pattern)) {
                var regexp = new RegExp(pattern);
                template_form = template_form.replace(regexp, modifications[pattern]);
            }
        }
    }

    return template_form;
};


var template_exists = function (template) {
    return fs.existsSync(templates_directory + '/' + template + '.html');
};

var get_template_path = function (template) {
    return templates_directory + '/' + template + '.html';
};

var create_template = function (error_properties) {
    var parent_properties = get_document_properties(error_properties.normal_form, [], true);
    var content = fs.readFileSync(get_template_path(TEMPLATE_TEMPLATE), "utf8");

    var parent_values = {};
    for (var i = 0; i < error_properties.placeholders.length; i++) {
        parent_values[error_properties.placeholders[i]] = S(parent_properties.parameters[i]).escapeHTML().s;
    }

    var values = {
        "title": S(error_properties.title).escapeHTML().s,
        parent_path: parent_properties.file_name,
        parent_title: S(error_properties.title).template(parent_values).escapeHTML().s
    };


    content = S(content).template(values).s;

    fs.writeFileSync(get_template_path(error_properties.template), content, "utf8", function (err) {
        console.log(err);
        process.exit();
    });
};

var get_post_path = function (error_properties, document_properties, document_index) {
    if (document_index === undefined) {
        document_index = 0;
    }

    var get_date_string  = function () {
        var date = new Date();

        var year = date.getFullYear();
        var month =  S(1).pad(2, '0').s;
        var day =  S(28 - document_index).pad(2, '0').s;

        return year + '-' + month + '-' + day;
    };

    var filename_body = document_properties.file_name;
    if (filename_body.length > MAX_FILE_NAME_LENGTH) {
        filename_body = filename_body.substr(0, MAX_FILE_NAME_LENGTH);
    }

    var post_path = auto_generated_posts_directory + '/';

    if (error_properties.template !== POST_TEMPLATE && document_properties.is_parent === false) {
        //post_path += '/auto-generated/' + error_properties.template + '/';
        post_path += error_properties.template + '/';
    }

    if (error_properties.template === POST_TEMPLATE) {
        post_path += DEFAULT_TEMPLATE_POST_TIMEPSTAMP;
    } else {
        post_path += get_date_string();
    }

    post_path += '-' + filename_body + '.html';
    return post_path;
};





var get_error_properties = function (normal_form) {
    return {
        "normal_form": normal_form,
        template: has_placeholders(normal_form) ? normal_form_to_file_name(normal_form) : POST_TEMPLATE,
        title: normal_form_to_template_form(normal_form),
        placeholders: get_placeholders(normal_form)
    };
};

var get_document_properties = function (normal_form, parameters, is_parent, counts) {
    var weight = Number.POSITIVE_INFINITY;
    if (counts !== undefined) {
        weight = 1;

        for (var count_index = 0; count_index < counts.length; count_index++) {
            weight *= counts[count_index];
        }
    }

    return {
        file_name: normal_form_to_file_name(normal_form, parameters),
        parameters: get_placeholder_values(normal_form, parameters),
        'is_parent': (is_parent) ? is_parent : false,
        'weight':weight
    };
};

var create_home_list = function (parents) {
    var is_parent_template_complete = function (parent) {
        var post_path = get_post_path(parent.error, parent.document);
        var content = fs.readFileSync(post_path, "utf8");
        var lines = content.split("\n");
        var line_count = lines.length;

        for (var line_index = 0; line_index < line_count; line_index++) {
            if (lines[line_index] === 'complete: false') {
                return false;
            }

            if (lines[line_index] === 'complete: true') {
                return true;
            }
        }

        return false;
    };

    var add_list_items = function (content, parents) {
        var lines = content.split("\n");
        var list_line_index = 0;
        var list_lines = [];

        for (var line_index = 0; line_index < lines.length; line_index++) {
            if (lines[line_index].indexOf('<li></li>') !== -1) {
                list_line_index = line_index;
            }
        }


        for (var parent_index = 0; parent_index < parents.length; parent_index++) {
            var template_values = {};

            for (var i = 0; i < parents[parent_index].error.placeholders.length; i++) {
                template_values[parents[parent_index].error.placeholders[i]] = S(parents[parent_index].document.parameters[i]).escapeHTML().s;
            }

            if (is_parent_template_complete(parents[parent_index])) {
                list_lines.push('<li><a href="/errors/html-validation/' + parents[parent_index].document.file_name + '"><i class="fa fa-li fa-file-text-o"></i>' + S(parents[parent_index].error.title).template(template_values).s + '</a></li>');
            } else {
                list_lines.push('<li><i class="fa fa-li fa-file-text-o"></i>' + S(parents[parent_index].error.title).template(template_values).s + '</li>');
            }
        }

        lines[list_line_index] = list_lines.join("\n");

        return lines.join("\n");
    };


    var post_path = includes_directory + '/top.html';
    var content = fs.readFileSync(get_template_path('home-top'), "utf8");

    content = add_list_items(content, parents);

    fs.writeFileSync(post_path, content, "utf8", function (err) {
        console.log(err);
        process.exit();
    });
};

program
    .option('-n, --noparams', 'Process parameterless errors only')
    .option('-p, --params', 'Process parametered errors only')
    .option('-c, --countmin [number]', 'Minimum error count to be considered', 0)
    .parse(process.argv);

fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }

    var error_data = JSON.parse(data);
    //var parameter_limit = 20;
    var parameter_limit = 20;
    //var error_limit = 27;
    var error_limit = 27;
    //var parameter_depth_limit = 4;
    var parameter_depth_limit = 4;

    var error_subset = error_data.slice(0, error_limit);

    var index_entries = [];

    for (var error_index = 0; error_index < error_subset.length; error_index++) {
        var error = error_data[error_index];

        if (program.noparams && error.hasOwnProperty('parameters')) {
            continue;
        }

        if (program.params && error.hasOwnProperty('parameters') === false) {
            continue;
        }

        if (error.count < program.countmin) {
            continue;
        }

        if (error.normal_form === '') {
            continue;
        }

        if (error.normal_form.substr(0, 3) === '<p>') {
            continue;
        }

//        if (error.normal_form != 'end tag for "%0" omitted, but OMITTAG NO was specified') {
//            continue;
//        }

        var error_properties = get_error_properties(error.normal_form);

        if (template_exists(error_properties.template)) {
            // Check template integrity
        } else {
            create_template(error_properties);
        }

        if (count_parameter_placeholders(error.normal_form) > parameter_depth_limit) {
            continue;
        }

        index_entries.push({
            "error":error_properties,
            "document":get_document_properties(error.normal_form, get_parent_document_parameters(error), true)
        });

    }

    create_home_list(index_entries);
});
