var fs = require('fs');
var program = require('commander');
var S = require('string');
var $ = require('jquery');

var file = __dirname + '/../_data/errors/html-validation/errors.json';
var posts_directory = __dirname + '/../_posts/errors/html-validation';
var templates_directory = __dirname + '/../_templates/errors/html-validation';
var includes_directory = __dirname + '/../_includes/generated/html-validation';

var TEMPLATE_TEMPLATE = 'template_default';
var POST_TEMPLATE = 'post_default';
var INDEX_TEMPLATE = 'index';
var MAX_FILE_NAME_LENGTH = 220;
var DEFAULT_TEMPLATE_POST_TIMEPSTAMP = '2013-07-27';

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

var required_document_file_names = {
    'there is no attribute "%0"':['there-is-no-attribute-data-width']
};

var placeholder_transforms = {
    'document-type-does-not-allow-element-x-here-missing-one-of-y-start-tag': function (parameters) {
        var y_parameters = S(parameters[1]).replaceAll('"', '').replaceAll(' ', '').s.split(',');
        var y_parameters_coded = '';

        for (var i = 0; i < y_parameters.length; i++) {
            y_parameters_coded += '<code>&lt;' + y_parameters[i] + '&gt;</code>';

            if (i < y_parameters.length - 1) {
                if (i === y_parameters.length - 2) {
                    y_parameters_coded += ' or ';
                } else {
                    y_parameters_coded += ', ';
                }
            }
        }

        return {
            'y_parameters_coded':(y_parameters_coded),
            'y_parameters': y_parameters.join(', ')
        };
    },
    'required-attribute-x-not-specified': function (parameters) {
        switch (parameters[0]) {
            case 'type':
                return {
                    'error_elements': ['script', 'style'].join(', '),
                    'equivalent_errors': []
                };

            case 'alt':
            case 'src':
                return {
                    'error_elements': ['img'].join(', '),
                    'equivalent_errors': ['an-img-element-must-have-an-alt-attribute-except-under-certain-conditions-for-details-consult-guidance-on-providing-text-alternatives-for-images']
                };

            case 'id':
                return {
                    'error_elements': ['map'].join(', '),
                    'equivalent_errors': []
                };

            case 'cols':
            case 'rows':
                return {
                    'error_elements': ['textarea'].join(', '),
                    'equivalent_errors': []
                };

            case 'action':
                return {
                    'error_elements': ['form'].join(', '),
                    'equivalent_errors': []
                };

            case 'content':
                return {
                    'error_elements': ['meta'].join(', '),
                    'equivalent_errors': []
                };

            case 'name':
                return {
                    'error_elements': ['param'].join(', '),
                    'equivalent_errors': []
                };

            default:
                return {
                    'error_elements':[],
                    'equivalent_errors': []
                };
        }
    }
};

var parent_document_parameters = {
    'No %0 element in scope but a %1 end tag seen.':['X', 'X']
};

var get_parent_document_parameters = function (error) {
    return (parent_document_parameters.hasOwnProperty(error.normal_form)) ? parent_document_parameters[error.normal_form] : [];
};

var get_document_by_filename = function (documents, file_name) {
    for (document_index = 0; document_index < documents.length; document_index++) {
        if (documents[document_index].file_name ===  file_name) {
            return documents[document_index];
        }
    }
};

var document_collection_contains_by_file_name = function (documents, file_name) {
    for (document_index = 0; document_index < documents.length; document_index++) {
        if (documents[document_index].file_name ===  file_name) {
            return true;
        }
    }

    return false;
};

var get_required_documents = function (normal_form, documents) {
    if (required_document_file_names.hasOwnProperty(normal_form) === false) {
        return [];
    }

    var required_documents = [];
    var required_document_keys = required_document_file_names[normal_form];
    for (var key_index = 0; key_index < required_document_keys.length; key_index++) {
        required_documents.push(get_document_by_filename(documents, required_document_keys[key_index]));
    }

    return required_documents;
};

var merge_document_collections = function (collection1, collection2) {
    for (var collection1_index = 0; collection1_index < collection1.length; collection1_index++) {
        if (document_collection_contains_by_file_name(collection2, collection1[collection1_index].file_name) === false) {
            collection2.push(collection1[collection1_index]);
        }
    }

    return collection2;
};


var current_posts = fs.readdirSync(posts_directory);

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

var normal_form_to_specific_form = function (normal_form, parameters) {
    var specific_form = S(normal_form).humanize().s;

    if (count_parameter_placeholders(specific_form) > 0) {
        var placeholder_letters = get_placeholder_values(specific_form, parameters);

        var placeholder_count = count_parameter_placeholders(specific_form);
        var placeholders = get_placeholders(specific_form);

        for (var placeholder_index = 0; placeholder_index < placeholder_count; placeholder_index++) {
            specific_form = specific_form.replace(placeholders[placeholder_index], placeholder_letters[placeholder_index]);
        }
    }

    return specific_form;
};

var normal_form_to_template_form = function (normal_form) {
    var modifications = {
        '^Id ':'ID ',
        '\. use':'. Use',
        ' css ':' CSS ',
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

var post_exists = function(file_name) {
    var escape_reg_exp = function(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    };

    var comparator = new RegExp(escape_reg_exp(file_name));

    for (var post_index = 0; post_index < current_posts.length; post_index++) {
        if (comparator.test(current_posts[post_index])) {
            return true;
        }
    }

    return false;
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

    var post_path = posts_directory + '/';

    if (error_properties.template !== POST_TEMPLATE) {
        post_path += '/auto-generated/' + error_properties.template + '/';
    }

    if (error_properties.template === POST_TEMPLATE) {
        post_path += DEFAULT_TEMPLATE_POST_TIMEPSTAMP;
    } else {
        post_path += get_date_string();
    }

    post_path += '-' + filename_body + '.html';
    return post_path;
};

var create_post = function (document_properties, error_properties, document_index) {
    var fix_yaml_escape_characters = function (content) {
        var header_body = content.split("---\n\n");
        var yaml = header_body[0];

        while (yaml.indexOf('\\') !== -1) {
            yaml = yaml.replace('\\', '');
        }

        header_body[0] = yaml;

        return header_body.join("---\n\n");
    };

    var set_category = function (content) {
        var lines = content.split("\n");

        for (var i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('categories: [') !== -1) {
                lines[i] = lines[i].replace(']', ', ' + error_properties.template + ']');
            }
        }

        return lines.join("\n");
    };

    var set_custom_section = function (document_section, is_parent, template_values) {
        var jqueryified = $('<div/>').html(document_section);

        var parameter_specific_sections = $('[data-parameter-specific=true]', jqueryified);
        var generic_sections = $('[data-generic=true]', jqueryified);

        if (parameter_specific_sections.length === 0 && generic_sections.length === 0) {
            return document_section;
        }

        if (is_parent) {
            parameter_specific_sections.each(function () {
                $(this).remove();
            });

            return jqueryified.html();
        }

        var is_parameter_specific_section_for = function (section, parameters) {
            if (section.attr('data-parameter-keys') === '') {
                return false;
            }

            if (section.attr('data-parameter-values') === '') {
                return false;
            }

            var parameter_keys = section.attr('data-parameter-keys').split(',');
            var parameter_values = section.attr('data-parameter-values').split(',');
            var parameter_keys_ignore = section.attr('data-parameter-keys-ignore').split(',');

            for (var parameter_index = 0; parameter_index < parameter_keys.length; parameter_index++) {
                var matchComparator = parameter_values[parameter_index];
                var currentParameterValue = S(parameters[parameter_keys[parameter_index]]).decodeHTMLEntities().s;

                if (parameter_keys_ignore.indexOf(currentParameterValue) !== -1) {
                    return false;
                }

                var isWildcardMatchRequired = matchComparator.substr(matchComparator.length - 1) === '*';
                var isSelectionMatchRequired = matchComparator.indexOf('|') !== -1;

                if (isWildcardMatchRequired) {
                    var regexpComparator = matchComparator.substr(0, matchComparator.length - 1);
                    var regexp = new RegExp(regexpComparator + '.*');

                    if (regexp.test(currentParameterValue) === false) {
                        return false;
                    }
                } else {
                    if (isSelectionMatchRequired) {
                        var matchComparators = matchComparator.split('|');
                        var isMatch = false;

                        for (var matchComparator_index = 0; matchComparator_index < matchComparators.length; matchComparator_index++) {
                            if (matchComparators[matchComparator_index] === currentParameterValue) {
                                isMatch = true;
                            }
                        }

                        if (isMatch === false) {
                            return false;
                        }
                    } else {
                        if (currentParameterValue !== matchComparator) {
                            return false;
                        }
                    }
                }
            }

            return true;
        };

        var has_matching_parameter_specific_section = false;

        parameter_specific_sections.each(function () {
            if (is_parameter_specific_section_for($(this), template_values)) {
               has_matching_parameter_specific_section = true;
            } else {
                $(this).remove();
            }
        });

        if (has_matching_parameter_specific_section) {
            generic_sections.each(function () {
                $(this).remove();
            });
        }

        return jqueryified.html();
    };

    var set_custom_sections = function (content, is_parent, template_values) {
        var post_sections = content.split("---\n\n");

        var modified_content = '';
        var document_sections = post_sections[1].split('<div class="section">');

        for (var document_section_index = 0; document_section_index < document_sections.length; document_section_index++) {
            var document_section_comparator = S(document_sections[document_section_index]).trim().s;

            if (document_section_comparator !== '') {
                var document_section = S(document_section_comparator.substr(0, document_section_comparator.length - 6)).trim().s;
                modified_content += '<div class="section">' + set_custom_section(document_section, is_parent, template_values) + '</div>' + "\n";
            }
        }

        post_sections[1] = modified_content;

        return post_sections.join("---\n\n");
    };

    if (!template_exists(error_properties.template)) {
        console.log("missing template: " + error_properties.template);
        process.exit();
    }

    var post_path = get_post_path(error_properties, document_properties, document_index);

    var content = fs.readFileSync(get_template_path(error_properties.template), "utf8");

    var template_values = {
        is_parent: (document_properties.is_parent) ? "true" : "false",
        parent_path: error_properties.template,
        parent_title: error_properties.template,
        date: post_path.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)[0]
    };

    for (var i = 0; i < error_properties.placeholders.length; i++) {
        if (document_properties.parameters[i] === '') {
            document_properties.parameters[i] = '<blank>';
        }

        template_values[error_properties.placeholders[i]] = S(document_properties.parameters[i]).escapeHTML().s.replace(':', '&#58;');
        template_values[error_properties.placeholders[i] + '_UPPER'] = S(document_properties.parameters[i]).escapeHTML().s.toUpperCase();
        template_values[error_properties.placeholders[i] + '_LOWER'] = S(document_properties.parameters[i]).escapeHTML().s.toLowerCase();
    }

    if (placeholder_transforms.hasOwnProperty(error_properties.template)) {
        var additional_template_values = placeholder_transforms[error_properties.template](document_properties.parameters);
        for (var key in additional_template_values) {
            if (additional_template_values.hasOwnProperty(key)) {
                template_values[key] = additional_template_values[key];
            }
        }
    }

    if (error_properties.template === POST_TEMPLATE) {
        template_values.title = S(error_properties.title).escapeHTML().s;
    }

    content = set_custom_sections(content, document_properties.is_parent, template_values);
    content = S(content).template(template_values).s;

    if (document_properties.file_name.indexOf('serif') !== -1) {
        content = fix_yaml_escape_characters(content);
    }

    if (!document_properties.is_parent) {
        content = set_category(content);
    }

    var post_directory = post_path.split('/').slice(0, post_path.split('/').length - 1).join('/');

    if (!fs.existsSync(post_directory)) {
        fs.mkdirSync(post_directory);
    }

    fs.writeFileSync(post_path, content, "utf8", function (err) {
        console.log(err);
        process.exit();
    });
};

var get_parameterised_documents = function (normal_form, parameters, parameter_properties, counts) {
    var documents = [];

    if (parameter_properties.hasOwnProperty('children')) {
        for (var child_parameter_name in parameter_properties.children) {
            documents = documents.concat(get_parameterised_documents(normal_form,parameters.concat(child_parameter_name),parameter_properties.children[child_parameter_name], counts.concat(parameter_properties.children[child_parameter_name].count)));
        }
    } else {
        documents.push(get_document_properties(normal_form, parameters, false, counts));
    }

    return documents;

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

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var create_errors_index = function (parents) {
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
                list_lines.push('<li><h2><a href="../' + parents[parent_index].document.file_name + '">' + S(parents[parent_index].error.title).template(template_values).s + '</a></h2></li>');
            } else {
                list_lines.push('<li><h2>' + S(parents[parent_index].error.title).template(template_values).s + '</h2></li>');
            }
        }

        lines[list_line_index] = list_lines.join("\n");

        return lines.join("\n");
    };

    var post_path = posts_directory + '/auto-generated/2010-01-01-index.html';
    var content = fs.readFileSync(get_template_path(INDEX_TEMPLATE), "utf8");

    content = add_list_items(content, parents);

    fs.writeFileSync(post_path, content, "utf8", function (err) {
        console.log(err);
        process.exit();
    });
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

        var error_properties = get_error_properties(error.normal_form);

        if (template_exists(error_properties.template)) {
            // Check template integrity
        } else {
            create_template(error_properties);
        }

        if (count_parameter_placeholders(error.normal_form) > parameter_depth_limit) {
            continue;
        }

        var parent_document = get_document_properties(error.normal_form, get_parent_document_parameters(error), true);
        var documents = [parent_document];

        index_entries.push({
            "error":error_properties,
            "document":parent_document
        });

        for (var parameter_value in error.parameters) {
            if (error.parameters.hasOwnProperty(parameter_value)) {
                documents = documents.concat(get_parameterised_documents(error.normal_form, [parameter_value], error.parameters[parameter_value], [error.parameters[parameter_value].count]));
            }
        }

        var required_documents = get_required_documents(error.normal_form, documents);
        documents = documents.sort(function (a, b) {
            if (a.weight > b.weight)
              return -1;
            if (a.weight < b.weight)
              return 1;

            return 0;
        }).slice(0, parameter_limit);

        documents = merge_document_collections(required_documents, documents);

        for (var document_index = 0; document_index < documents.length; document_index++) {
            if (post_exists(documents[document_index].file_name)) {
                // Check post integrity TBC
            } else {
                create_post(documents[document_index], error_properties, document_index);
            }
        }
    }

    create_errors_index(index_entries);
    create_home_list(index_entries);
});
