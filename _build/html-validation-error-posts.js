var fs = require('fs');
var file = __dirname + '/../_data/errors/html-validation/errors_1.json';
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
            placeholder_letters.push(String.fromCharCode(index));
        }
        
        if (parameters !== undefined) {
            for (var parameter_index = 0; parameter_index < parameters.length; parameter_index++) {
                
            }
        }

        return placeholder_values;
    }

    var file_name = normal_form.toLowerCase();

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

    if (count_parameter_placeholders(file_name) === 0) {
        return encodeURIComponent(file_name);
    }

    var placeholder_letters = get_placeholder_values(file_name, parameters);
    var placeholder_count = count_parameter_placeholders(file_name);
    var placeholders = get_placeholders(file_name);

    for (var placeholder_index = 0; placeholder_index < placeholder_count; placeholder_index++) {
        file_name = file_name.replace(placeholders[placeholder_index], placeholder_letters[placeholder_index]);
    }

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



fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }

    var error_data = JSON.parse(data);    
    var parameter_limit = 5;

    for (var error_index = 0; error_index < error_data.length; error_index++) {        
        var error = error_data[error_index];
        var parent_file_name = normal_form_to_file_name(error.normal_form);
        
        console.log(parent_file_name);
        console.log(post_exists(parent_file_name) ? 'Y' : 'N');
        console.log(error.frequency);
        console.log(error.normal_form);
        
        if (error.hasOwnProperty('parameters')) {
            
            //if (error.parameters.length === 1) {
                var parameter_set = error.parameters[0];
                var output_parameter_count = 0;
                
                for (parameter_name in parameter_set) {
                    if (parameter_set.hasOwnProperty(parameter_name)) {
                        if (output_parameter_count < parameter_limit) {
                            var scoped_file_name = normal_form_to_file_name(error.normal_form, [parameter_name]);
                            
                            console.log(scoped_file_name);
                            console.log(parameter_name);
                            console.log(parameter_set[parameter_name]);     
                            output_parameter_count++;
                        }
                    }
                }             
            //}
            
            process.exit(0);

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
    }
});
