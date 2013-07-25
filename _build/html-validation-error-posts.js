var fs = require('fs');
var program = require('commander');
var S = require('string');

var file = __dirname + '/../_data/errors/html-validation/errors.json';
var posts_directory = __dirname + '/../_posts/errors/html-validation';
var templates_directory = __dirname + '/../_templates/errors/html-validation';

var TEMPLATE_TEMPLATE = 'template_default';
var POST_TEMPLATE = 'post_default';
var MAX_FILE_NAME_LENGTH = 220;

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
            'y_parameters_coded':(y_parameters_coded)
        };
    }
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
            placeholder_values[parameter_index] = parameters[parameter_index].toLowerCase();
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
    file_name = replace_global('&amp', 'ampsersand_placeholder', file_name);
    file_name = replace_global('&', 'ampsersand', file_name);
    file_name = replace_global('ampsersand_placeholder', 'amp', file_name);
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
    var template_form = S(normal_form).humanize().s;
    
    var placeholders = get_placeholders(normal_form);
    
    for (var placeholderIndex = 0; placeholderIndex < placeholders.length; placeholderIndex++) {
        var template_placeholder = '{{'+placeholders[placeholderIndex]+'}}';
        template_form = template_form.replace(placeholders[placeholderIndex], template_placeholder);
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

var get_post_path = function (error_properties, document_properties) {
    var get_date_string  = function () {
        var date = new Date();
        
        var year = date.getFullYear();
        var month =  S(date.getMonth() + 1).pad(2, '0').s;
        var day =  S(date.getDate() + 1).pad(2, '0').s;
        
        return year + '-' + month + '-' + day;
    };  
    
    var filename_body = document_properties.file_name;
    if (filename_body.length > MAX_FILE_NAME_LENGTH) {
        filename_body = filename_body.substr(0, MAX_FILE_NAME_LENGTH);
    }
    
    var post_path = posts_directory + '/';
    
    post_path += error_properties.template + '/';
    post_path +=get_date_string() + '-' + filename_body + '.html';        
    return post_path;
};

var create_post = function (document_properties, error_properties) {
    var set_category = function (content) {
        var lines = content.split("\n");
        
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('categories: [') !== -1) {
                lines[i] = lines[i].replace(']', ', ' + error_properties.template + ']');
            }
        }
        
        return lines.join("\n");
    };

   
    if (!template_exists(error_properties.template)) {
        console.log("missing template: " + error_properties.template);
        process.exit();
    }
    
    var post_path = get_post_path(error_properties, document_properties);    
    var content = fs.readFileSync(get_template_path(error_properties.template), "utf8");
    
    var template_values = {
        is_parent: (document_properties.is_parent) ? "true" : "false",
        parent_path: error_properties.template,
        parent_title: error_properties.template,
    };
    
    for (var i = 0; i < error_properties.placeholders.length; i++) {
        template_values[error_properties.placeholders[i]] = S(document_properties.parameters[i]).escapeHTML().s;
    }
    
    if (placeholder_transforms.hasOwnProperty(error_properties.template)) {        
        var additional_template_values = placeholder_transforms[error_properties.template](document_properties.parameters);
        for (var key in additional_template_values) {
            if (additional_template_values.hasOwnProperty(key)) {
                template_values[key] = additional_template_values[key];
            }
        }
    }
    
    content = S(content).template(template_values).s;

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

var get_parameterised_documents = function (normal_form, parameters, parameter_properties) {
    var documents = [];
    
    if (parameter_properties.hasOwnProperty('children')) {        
        for (var child_parameter_name in parameter_properties.children) {            
            documents = documents.concat(get_parameterised_documents(normal_form, parameters.concat(child_parameter_name), parameter_properties.children[child_parameter_name]));
        }
    } else {
        documents.push(get_document_properties(normal_form, parameters));  
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

var get_document_properties = function (normal_form, parameters, is_parent) {   
    return {
        file_name: normal_form_to_file_name(normal_form, parameters),
        parameters: get_placeholder_values(normal_form, parameters),
        "is_parent": (is_parent) ? is_parent : false
    };
};

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

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
    var parameter_limit = 2;
    var error_limit = 5;
    var error_count = 0;

    for (var error_index = 0; error_index < error_data.length; error_index++) {        
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
        
        error_count++;
        
        var error_properties = get_error_properties(error.normal_form);
        
        if (template_exists(error_properties.template)) {
            // Check template integrity
        } else {
            create_template(error_properties);
        }
        
        var documents = [get_document_properties(error.normal_form, [], true)];
        
        var output_parameter_count = 0;

        for (var parameter_value in error.parameters) {
            if (error.parameters.hasOwnProperty(parameter_value)) {                    
                if (isNumber(parameter_value)) {
                    continue;
                }

                if (output_parameter_count < parameter_limit) {
                    documents = documents.concat(get_parameterised_documents(error.normal_form, [parameter_value], error.parameters[parameter_value]));
                }                    

                output_parameter_count++;
            }
        }    
        
        for (var documentIndex = 0; documentIndex < documents.length; documentIndex++) {
            if (post_exists(documents[documentIndex].file_name)) {
                // Check post integrity TBC
            } else {
                create_post(documents[documentIndex], error_properties);
            }
        }       
        
        if (error_count >= error_limit) {
            process.exit(0);
        }

    }
});
