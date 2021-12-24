module.exports = function transformObject(obj, parentPath, sourceProperty, targetProperty, callback) {
    // Support (multi-dimensional) arrays
    var fixedParentPath = parentPath.trim().replace("[", ".[");
    
    var nestedPropertyNames = fixedParentPath.split(".");
    
    transform(obj, nestedPropertyNames, sourceProperty, targetProperty, callback);
}

function transform(obj, nestedPropertyNames, sourceProperty, targetProperty, callback) {
    if (nestedPropertyNames.length === 0) {
        // We have reached the specified nested object, so time to transform the specified property
        var sourceProperty = obj[sourceProperty];
    
        if(sourceProperty) {
            try {
                // Apply the callback to the source property, and store the result in the target property
                obj[targetProperty] = callback(sourceProperty); 
            }
            catch(err) {
                throw "The callback function failed: " + err;
            }
        }
        else {
            if (Array.isArray(obj)) {
                throw "Cannot find the specified source property '" + sourceProperty  + "' in the array (since no [..] has been specified)";
            }
            else {
                throw "Cannot find the specified source property '" + sourceProperty  + "' in the specified object";
            }
        }
    }
    else {
        // We have not reached the specified nested object yet, so let's go downwards in the nested hierarchy
        var nestedPropertyName = nestedPropertyNames.shift().trim();

        var isArray = Array.isArray(obj);

        if(isArray) {
            if(!nestedPropertyName.startsWith("[") || !nestedPropertyName.endsWith("]")) {
                throw "Missing brackets for array";
            }
            
            // Remove the square brackets
            nestedPropertyName = nestedPropertyName.slice(1,-1).trim();
            
            if(nestedPropertyName === "") {
                // Expression "[]" means: recursively call this function for every element of the array
                for (var j = 0; j < obj.length; j++) {
                    transform(obj[j], nestedPropertyNames, sourceProperty, targetProperty, callback);
                }
            }
            else {
                var index = parseInt(nestedPropertyName);
                
                if(Number.isInteger(index)) {
                    if (index > obj.length) {
                        throw "The specified array index exceeds the array length";                     
                    }
                    
                    // Expression "[2]" means: recursively call this function only for the second element of the array
                    transform(obj[index], nestedPropertyNames, sourceProperty, targetProperty, callback);                       
                }
                else {
                    throw "Specify an integer number between the brackets";
                }
            }
        }
        else {
            // An object, so let's go downwards in the hierarchy
            if(!obj.hasOwnProperty(nestedPropertyName)) {
                throw "The nested property '" + nestedPropertyName + "' does not exist";
            }
    
            // Get the specified property from the object
            obj = obj[nestedPropertyName];
    
            // Go down in the hierarchy
            transform(obj, nestedPropertyNames, sourceProperty, targetProperty, callback);
        }
    }
}