var fs = require('fs');
var file = __dirname + '/../_data/errors/html-validation/errors.json';
var posts_directory = __dirname + '/../_posts/errors/html-validation';

var current_posts = fs.readdirSync(posts_directory);

var normal_form_to_file_name = function(normal_form, parameters) {
    var replace_global = function(search, replace, subject) {
        while (subject.indexOf(search) !== -1) {
            subject = subject.replace(search, replace);
        }

        return subject;
    };

    var get_placeholders = function(file_name) {
        return file_name.match(/\"?%[0-9]"?/g);
    };

    var count_parameter_placeholders = function(file_name) {
        var matches = file_name.match(/\"?%[0-9]"?/g);
        if (matches !== null) {
            return matches.length;
        }

        return 0;
    }

    var get_placeholder_values = function(file_name, parameters) {
        var start = 120;
        var placeholder_count = count_parameter_placeholders(file_name);

        if (placeholder_count > 3) {
            start = start - placeholder_count + 3;
        }

        var placeholder_values = [];

        for (var index = start; index < start + placeholder_count; index++) {
            placeholder_values.push(String.fromCharCode(index));
        }
        
        if (parameters !== undefined) {
            for (var parameter_index = 0; parameter_index < parameters.length; parameter_index++) {
                placeholder_values[parameter_index] = parameters[parameter_index].toLowerCase();
            }
        }

        return placeholder_values;
    }

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
    file_name = replace_global('--', '-', file_name);

    return encodeURIComponent(file_name);
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
        var scoped_file_name = normal_form_to_file_name(normal_form, parameters);
        file_names.push(scoped_file_name);        
    }
    
    return file_names;
    
    
    console.log(scoped_file_name);
    console.log(parameter_properties.hasOwnProperty('children'));    
    
};

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }

    var error_data = JSON.parse(data);    
    var parameter_limit = 3;
    var error_limit = 5;
    var error_count = 0;

    for (var error_index = 0; error_index < error_data.length; error_index++) {        
        var error = error_data[error_index];
        var parent_file_name = normal_form_to_file_name(error.normal_form);
        
        console.log(parent_file_name);
        //console.log(post_exists(parent_file_name) ? 'Y' : 'N');
        //console.log(error.count);
        console.log(error.normal_form);
//        
//        if (error.normal_form === 'Attribute %0 not allowed on element %1 at this point.') {
//            console.log(error);
//            process.exit(0);
//        }
        
        if (error.hasOwnProperty('parameters')) {
            var output_parameter_count = 0;
            
            for (var parameter_name in error.parameters) {
                if (error.parameters.hasOwnProperty(parameter_name)) {                    
                    if (isNumber(parameter_name)) {
                        continue;
                    }
                    
//                    if (error.parameters[parameter_name].hasOwnProperty('children')) {
//                        console.log(parameter_name, error.parameters);
//                        process.exit(0);
//                    }
                    
                    if (output_parameter_count < parameter_limit) {                        
                        
                        //var scoped_file_name = normal_form_to_file_name(error.normal_form, [parameter_name]);
                        var file_names = get_parameterised_file_names(error.normal_form, [parameter_name], error.parameters[parameter_name]);
                        console.log(file_names);
                    }
                    
                    
                    output_parameter_count++;
//                    
//                    
//                    var parameter_properties = error.parameters[parameter_name];
//                    console.log(parameter_properties);
                }
                
                
                
                
                //process.exit(0);
                
                
//                if (error.parameters.hasOwnProperty(parameter_name)) {
//                    if (output_parameter_count < parameter_limit) {
//                        var scoped_file_name = normal_form_to_file_name(error.normal_form, [parameter_name]);
//                        console.log(scoped_file_name);
//                        console.log(error.parameters[parameter_name].hasOwnProperty('children'));
//                    }                   
//                    
//                    output_parameter_count++;
//                }
            }
            
//            for (var parameter_set_index = 0; parameter_set_index < error.parameters.length; parameter_set_index++) {
//                var parameter_set = error.parameters[parameter_set_index];
//                
//                
//                //console.log("Set " + parameter_set_index);
//                
////                for (parameter_name in parameter_set) {
////                    if (parameter_set.hasOwnProperty(parameter_name)) {                        
////                        console.log(parameter_name);
////                        
//////                        if (output_parameter_count < parameter_limit) {                            
//////                            //var scoped_file_name = normal_form_to_file_name(error.normal_form, [parameter_name]);
//////                            
//////                            //console.log(scoped_file_name);
//////                            console.log(parameter_name);
//////                            console.log(parameter_set[parameter_name]);     
//////                            output_parameter_count++;
//////                        }
////                    }
////                }
//                
//                console.log();
//            }
            
            //if (error.parameters.length === 1) {
           
            //}
            
            if (error_count >= error_limit) {
                process.exit(0);
            }
            
            

        }
        
        console.log("\n");
        
//        if (error_index === 1) {
//            console.log(error_data[error_index]);
            //
//        }
        
        
        
        
//        file_name = normal_form_to_file_name(data[error_index].normal_form);
//
//        if ( {
//            console.log(file_name);
//        } else {
//            
//        }
        

        //console.log(data[error_index].frequency);
        //console.log(data[error_index].normal_form);
        
        error_count++;
    }
});
