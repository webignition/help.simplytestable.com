var fs = require('fs');
var program = require('commander');
var S = require('string');

var file = __dirname + '/../_data/errors/html-validation/errors.json';
var posts_directory = __dirname + '/../_posts/errors/html-validation';
var templates_directory = __dirname + '/../_templates/errors/html-validation';

var TEMPLATE_TEMPLATE = 'template_default';
var POST_TEMPLATE = 'post_default';

var current_posts = fs.readdirSync(posts_directory);

var get_placeholders = function(normal_form) {
    placeholders = normal_form.match(/\"?%[0-9]"?/g);
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
    var content = fs.readFileSync(get_template_path(TEMPLATE_TEMPLATE), "utf8");
    
    var values = {
        "title": error_properties.title
    };
    
    content = S(content).template(values).s;    
    
    
    fs.writeFileSync(get_template_path(error_properties.template), content, "utf8", function (err) {
        console.log("Error creating template: " + error_properties.template);
        console.log(err);
        process.exit();
    });
};

var create_post = function (document_properties, error_properties) {
    console.log(document_properties);
    console.log(error_properties);
    //process.exit();
    var get_date_string  = function () {
        var date = new Date();
        
        var year = date.getFullYear();
        var month =  S(date.getMonth() + 1).pad(2, '0').s;
        var day =  S(date.getDate() + 1).pad(2, '0').s;
        
        return year + '-' + month + '-' + day;
    };
//    
//    var template = (template === undefined) ? 'default' : template;    
//    
    if (!template_exists(error_properties.template)) {
        console.log("missing template: " + error_properties.template);
        process.exit();
    }
    
    var post_path = posts_directory + '/' + get_date_string() + '-' + document_properties.file_name + '.html';
    
    var content = fs.readFileSync(get_template_path(error_properties.template), "utf8");
    
    var template_values = {};
    
    for (var i = 0; i < error_properties.placeholders.length; i++) {
        template_values[error_properties.placeholders[i]] = document_properties.parameters[i];
    }
    
    content = S(content).template(template_values).s;
    
    console.log(template_values);
    console.log(content);
    process.exit();
//        
//        
//    
//    
//    
//    
//    
//    
//    var content = fs.readFileSync(get_template_path(template), "utf8");
//    var values = {
//        "title": S(title).escapeHTML()
//    };
//    
//    content = S(content).template(values).s;
////console.log(templateContent);
//
//fs.writeFileSync(post_path, content, "utf8", function (err) {
//    console.log(err);
//});
//    
////    console.log(post_path);
////    console.log(template);
////    console.log(get_template_path(template));
//    //process.exit();    
};

var get_parameterised_file_names = function (normal_form, parameters, parameter_properties) {    
    var file_names = [];
    
    if (parameter_properties.hasOwnProperty('children')) {        
        for (var child_parameter_name in parameter_properties.children) {            
            var child_file_names = get_parameterised_file_names(normal_form, parameters.concat(child_parameter_name), parameter_properties.children[child_parameter_name]);
            
            for (var child_file_name_index = 0; child_file_name_index < child_file_names.length; child_file_name_index++) {                
                file_names.push(child_file_names[child_file_name_index]);
            }
        }
    } else {
        file_names.push(normal_form_to_file_name(normal_form, parameters));        
    }
    
    return file_names;    
};

var get_parameterised_specific_forms = function (normal_form, parameters, parameter_properties) {        
    var specific_forms = [];
    
    if (parameter_properties.hasOwnProperty('children')) {        
        for (var child_parameter_name in parameter_properties.children) {            
            var child_file_names = get_parameterised_specific_forms(normal_form, parameters.concat(child_parameter_name), parameter_properties.children[child_parameter_name]);
            
            for (var child_file_name_index = 0; child_file_name_index < child_file_names.length; child_file_name_index++) {                
                specific_forms.push(child_file_names[child_file_name_index]);
            }
        }
    } else {
        specific_forms.push(normal_form_to_specific_form(normal_form, parameters));        
    }
    
    return specific_forms;    
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
        template: has_placeholders(normal_form) ? normal_form_to_file_name(normal_form) : 'default',
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
    var parameter_limit = 3;
    var error_limit = 1;
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
        
//        console.log(error_properties);
//        console.log(documents);
//        process.exit();
//        
        
        for (var documentIndex = 0; documentIndex < documents.length; documentIndex++) {
            if (post_exists(documents[documentIndex].file_name)) {
                // Check post integrity TBC
            } else {
                create_post(documents[documentIndex], error_properties);
            }
        }

        
//        var file_names = [normal_form_to_file_name(error.normal_form)];
//        var specific_forms = [normal_form_to_specific_form(error.normal_form)];
//        
//        console.log(file_names);

        //console.log("\n");        
        
        if (error_count >= error_limit) {
            process.exit(0);
        } 
        

        
        continue;
  
        var output_parameter_count = 0;

        for (var parameter_name in error.parameters) {
            if (error.parameters.hasOwnProperty(parameter_name)) {                    
                if (isNumber(parameter_name)) {
                    continue;
                }

                if (output_parameter_count < parameter_limit) {
                    file_names = file_names.concat(get_parameterised_file_names(error.normal_form, [parameter_name], error.parameters[parameter_name]));
                    specific_forms = specific_forms.concat(get_parameterised_specific_forms(error.normal_form, [parameter_name], error.parameters[parameter_name]));
                }                    

                output_parameter_count++;
            }
        }
        
        var requiresTemplate = error.hasOwnProperty('parameters'); // parameter-filled files will require a template
        var isTemplate = true; // parent files will be made in to templates

        console.log(error.normal_form);
        console.log(parent_file_name);
//        console.log(parent_title);
//        console.log("post_exists: " + post_exists(parent_file_name));
//        //console.log("template_exists: " + post_exists(parent_file_name));
        console.log("requiresTemplate: " + requiresTemplate);
//        console.log("isTemplate: " + isTemplate);
        
        if (requiresTemplate && !template_exists(parent_file_name)) {
            console.log("missing template!: " + parent_file_name);
            process.exit();
        }        
        
        //console.log(file_names);
        console.log("\n");        

        
        if (!post_exists(parent_file_name)) {
            create_post(parent_file_name, parent_title, error.normal_form,requiresTemplate ? parent_file_name : undefined);
        }
        
        //console.log(error.count + "\t" +error.normal_form);

        

//        //console.log(post_exists(parent_file_name) ? 'Y' : 'N');
//        //console.log(error.count);
//        //console.log(error.normal_form);
//        
//        error_count++;
//        
//        if (program.noparams === false && error.hasOwnProperty('parameters')) {
//            var output_parameter_count = 0;
//            
//            for (var parameter_name in error.parameters) {
//                if (error.parameters.hasOwnProperty(parameter_name)) {                    
//                    if (isNumber(parameter_name)) {
//                        continue;
//                    }
//                    
//                    if (output_parameter_count < parameter_limit) {
//                        var file_names = get_parameterised_file_names(error.normal_form, [parameter_name], error.parameters[parameter_name]);
//                        console.log(file_names);
//                    }                    
//                    
//                    output_parameter_count++;
//                }
//            }
//            
//            if (error_count >= error_limit) {
//                process.exit(0);
//            }
//
//        }
//
//        if (error_count >= error_limit) {
//            process.exit(0);
//        }
        
        //console.log("\n");

    }
});
