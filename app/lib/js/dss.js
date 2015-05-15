// This is only for a few of the parsers.
var marked = require("marked");

// DSS Object
var dss = (function(){

 // Store reference
 var _dss = function(){};

 // Default detect function
 _dss.detect = function(){
  return true;
 };

 /*
  * Modify detector method
  *
  * @param (Function) The callback to be used to detect variables
  */
 _dss.detector = function(callback){
  _dss.detect = callback;
 };

 // Store parsers
 _dss.parsers = {};

 /*
  * Add a parser for a specific variable
  *
  * @param (String) The name of the variable
  * @param (Function) The callback to be executed at parse time
  */
 _dss.parser = function(name, callback){
  _dss.parsers[name] = callback;
 };

 /*
  * Trim whitespace from string
  *
  * @param (String) The string to be trimmed
  * @return (String) The trimmed string
  */
 _dss.trim = function(str, arr){
  var defaults = [/^\s\s*/, /\s\s*$/];
  arr = (_dss.isArray(arr)) ? arr.concat(defaults) : defaults;
  arr.forEach(function(regEx){
   str = str.replace(regEx, '');
  });
  return str;
 };

 /*
  * Check if object is an array
  *
  * @param (Object) The object to check
  * @return (Boolean) The result of the test
  */
 _dss.isArray = function(obj){
  return toString.call(obj) == '[object Array]';
 };

 /*
  * Check the size of an object
  *
  * @param (Object) The object to check
  * @return (Boolean) The result of the test
  */
 _dss.size = function(obj){
  var size = 0;
  for (var key in obj){
   if(Object.prototype.hasOwnProperty.call(obj, key))
    size++;
  }
  return size;
 };

 /*
  * Iterate over an object
  *
  * @param (Object) The object to iterate over
  * @param (Function) Callback function to use when iterating
  * @param (Object) Optional context to pass to iterator
  */
 _dss.each = function(obj, iterator, context){
  if(obj == null) return;
  if(obj.length === +obj.length){
   for (var i = 0, l = obj.length; i < l; i++){
    if(iterator.call(context, obj[i], i, obj) === {}) return;
   }
  }else{
   for (var key in obj){
    if(_.has(obj, key)){
     if(iterator.call(context, obj[key], key, obj) === {}) return;
    }
   }
  }
 };

 /*
  * Extend an object
  *
  * @param (Object) The object to extend
  */
 _dss.extend = function(obj){
  _dss.each(Array.prototype.slice.call(arguments, 1), function(source){
   if(source){
    for (var prop in source){
     obj[prop] = source[prop];
    }
   }
  });
  return obj;
 };

 /*
  * Squeeze unnecessary extra characters/string
  *
  * @param (String) The string to be squeeze
  * @param (String) The string to be matched
  * @return (String) The modified string
  */
 _dss.squeeze = function(str, def){
  return str.replace(/\s{2,}/g, def);
 };

 /*
  * Normalizes the comment block to ignore any consistent preceding
  * whitespace. Consistent means the same amount of whitespace on every line
  * of the comment block. Also strips any whitespace at the start and end of
  * the whole block.
  *
  * @param (String) Text block
  * @return (String) A cleaned up text block
  */
 _dss.normalize = function(text_block){

  // Strip out any preceding [whitespace]* that occur on every line. Not
  // the smartest, but I wonder if I care.
  text_block = text_block.replace(/^(\s*\*+)/, '');

  // Strip consistent indenting by measuring first line's whitespace
  var indent_size = false;
  var unindented = (function(lines){
   return lines.map(function(line){
    var preceding_whitespace = line.match(/^\s*/)[0].length;
    if(!indent_size)
     indent_size = preceding_whitespace;
    if(line == ''){
     return '';
    }else if(indent_size <= preceding_whitespace && indent_size > 0){
     return line.slice(indent_size, (line.length - 1));
    }else{
     return line;
    }
   }).join("\n");
  })(text_block.split("\n"));

  return _dss.trim(text_block);

 };

 /*
  * Takes a file and extracts comments from it.
  *
  * @param (Object) options
  * @param (Function) callback
  */
 _dss.parse = function(lines, options, callback){

  // Options
  options = (options) ? options : {};
  options.preserve_whitespace = !!(options.preserve_whitespace);

  // Setup
  var _this = this,
      current_block = '',
      inside_single_line_block = false,
      inside_multi_line_block = false,
      last_line = '',
      start = "{start}",
      end = "{/end}",
      _parsed = false,
      _blocks = [],
      parsed = '',
      blocks = [],
      temp = {},
      lineNum = 0;

  /*
   * Parses line
   *
   * @param (Num) the line number
   * @param (Num) number of lines
   * @param (String) line to parse/check
   * @return (Boolean) result of parsing
   */
  var parser = function(temp, line, block, file){
   var indexer = function(str, find){
        return (str.indexOf(find) > 0) ? str.indexOf(find) : false;
       },
       parts = line.replace(/.*@/, ''),
       i = indexer(parts, ' ') || indexer(parts, '\n') || indexer(parts, '\r') || parts.length,
       name = _dss.trim(parts.substr(0, i)),
       description = _dss.trim(parts.substr(i)),
       variable = _dss.parsers[name],
       index = block.indexOf(line);
   // added by Tyler Benton
   var endOfBlockRegex = /\n\s*#{{(\d*)}}/,
       endOfBlock = block.match(endOfBlockRegex)[1],
       block = block.replace(endOfBlockRegex, "");

   line = {};

   // Edited by Tyler Benton
   line[name] = (variable) ? variable.apply(null, [index, description, block, file, endOfBlock]) : '';

   if(temp[name]){
    if(!_dss.isArray(temp[name]))
     temp[name] = [temp[name]];
    temp[name].push(line[name]);
   }else{
    temp = _dss.extend(temp, line);
   }
   return temp;
  };

  /*
   * Comment block
   */
  var block = function(){
   this._raw = (comment_text) ? comment_text : '';
   this._filename = filename;
  };

  /*
   * Check for single-line comment
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  var single_line_comment = function(line){
   return !!line.match(/^\s*\/\//g);
  };

  /*
   * Checks for start of a multi-line comment
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  var start_multi_line_comment = function(line){
   return !!line.match(/^\s*\/\*/);
  };

  /*
   * Check for end of a multi-line comment
   *
   * @parse (String) line to parse/check
   * @return (Boolean) result of check
   */
  var end_multi_line_comment = function(line){
   if(single_line_comment(line))
    return false;
   return !!line.match(/.*\*\//);
  };

  /*
   * Removes comment identifiers for single-line comments.
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  var parse_single_line = function(line){
   return line.replace(/\s*\/\//g, '');
  };

  /*
   * Remove comment identifiers for multi-line comments.
   *
   * @param (String) line to parse/check
   * @return (Boolean) result of check
   */
  var parse_multi_line = function(line){
   var cleaned = line.replace(/\s*\/\*/, '');
   return cleaned.replace(/\*\//, '');
  };

  lines = lines + '';
  lines.split(/\n/).forEach(function(line){
   lineNum = lineNum + 1;
   line = line + '';

   // Parse Single line comment
   if(single_line_comment(line)){
    parsed = parse_single_line(line);
    if(inside_single_line_block){
     current_block += '\n' + parsed;
    }else{
     current_block = parsed;
     inside_single_line_block = true;
    }
   }

   // Parse multi-line comments
   if(start_multi_line_comment(line) || inside_multi_line_block){
    parsed = parse_multi_line(line);
    if(inside_multi_line_block){
     current_block += '\n' + parsed;
    }else{
     current_block += parsed;
     inside_multi_line_block = true;
    }
   }

   // End a multi-line block
   if(end_multi_line_comment(line)){
    inside_multi_line_block = false;
   }

   // Store current block if done
   if(!single_line_comment(line) && !inside_multi_line_block){
    if(current_block){
     // _blocks.push(_dss.normalize(current_block));
     _blocks.push(_dss.normalize(current_block.concat("\n #{{" + lineNum + "}}")));
    }
    inside_single_line_block = false;
    current_block = '';
    last_line = '';
   }

  });

  // Done first pass
  _parsed = true;

  // Create new blocks with custom parsing
  _blocks.forEach(function(block){
   // Remove extra whitespace
   block = block.split('\n').filter(function(line){
    return (_dss.trim(_dss.normalize(line)));
   }).join('\n');

   // Split block into lines
   block.split('\n').forEach(function(line){
    if(_dss.detect(line))
     temp = parser(temp, _dss.normalize(line), _dss.normalize(block), lines);
   });

   // Push to blocks if object isn't empty
   if(_dss.size(temp))
    blocks.push(temp);
   temp = {};

  });
  // Execute callback with filename and blocks
  callback({
   blocks: blocks
  });

 };


 // Documented style sheets
 // ------------------------------
 // helper function to finds the next instance of a parser (if there is one based on the @ symbol)
 // in order to isolate the current multi-line parser

 // @author Tyler Benton
 _dss.getCurrentParserBlock = function(i, block, callback){
  var firstLine = /^.*$/m,
      hr = /^\s*?---(?:.*\n?)/gm,
      nextParserIndex = block.indexOf(" @", i + 1),
      markupLength = nextParserIndex > -1 ? nextParserIndex - i : block.length,
      currentBlock = block.split("").splice(i, markupLength).join("").replace(firstLine, "").replace(hr, ""),
      spaces = dss.trimBlock(currentBlock).split("\n").map(function(line){
                return line.match(/^\s*/)[0].length;
               }),
      totalSpaces = Math.min.apply(Math, spaces);

  return currentBlock.split("\n").map(function(line){
          return line.slice(totalSpaces, line.length);
         }).join("\n");
 };

 // @author Tyler Benton
 // @description
 // trims the top and bottom of a string to remove any blank.
 // doesn't affect individual lines.
 _dss.trimBlock = function (str){
  return str.replace(/^(\n*|\s*)/, "").replace(/(\n*|\s*)$/, "");
 };

 // @author Tyler Benton
 // @description - trims the white space off of each line in a block.
 _dss.trimLines = function(str){
  return str.split("\n").map(function(line){
          return line.trim();
         }).join("\n");
 };

 // @author Tyler Benton
 // @description - This will get the code directly after the block
 _dss.getCodeAfterBlock = function(file, endOfBlock){
  var splitFile = file.split("\n"),
      codeAfterBlock = splitFile.splice(endOfBlock - 1, splitFile.length).join("\n").replace(/^\s*?\*\/$\n*/m, ""), // removes any white space or comment from the start and end of the block. just incase.
      commentTypes = ["// ---", "* ---", "// @", "* @", "\n\n\n"],
      next = codeAfterBlock.length;
  // finds the first comment type
  commentTypes.forEach(function(commentType){
   var index = codeAfterBlock.indexOf(commentType);
   return next = index === -1 || next < index ? next : index;
  });
  codeAfterBlock = codeAfterBlock.slice(0, next)
  return codeAfterBlock.slice(0, next);
 }

 // Return function
 return _dss;

})();

// Describe detection pattern
dss.detector(function(line){
 if(typeof line !== 'string')
  return false;
 var reference = line.split("\n\n").pop();
 return !!reference.match(/.*@/);
});

// Describe parsing a name
dss.parser("name", function(i, line, block, file){
 return line;
});

// Describe parsing a description
dss.parser("description", function(i, line, block, file){
 return line;
});

// Describe parsing a state
dss.parser("state", function(i, line, block, file){
 var state = line.split(' - ');
 return {
  name: (state[0]) ? dss.trim(state[0]) : '',
  escaped: (state[0]) ? dss.trim(state[0].replace('.', ' ').replace(':', ' pseudo-class-')) : '',
  description: (state[1]) ? dss.trim(state[1]) : ''
 };
});


// @author Tyler Benton
// complete
dss.parser("name", function(i, line, block, file){
 return line.trim();
});


// @author Tyler Benton
// complete
dss.parser("page", function(i, line, block, file){
 var page = line.split("/");
 return {
  nav: page[0] ? page[0].trim() : "",
  section: page[1] ? page[1] : "general"
 };
});


// @author Tyler Benton
// complete
dss.parser("author", function(i, line, block, file){
 return line.trim();
});


// @author Tyler Benton
// complete
dss.parser("description", function(i, line, block, file){
 return marked(line ? line.trim() : dss.getCurrentParserBlock(i, block));
});


// @author Tyler Benton
// needs to be reviewed
dss.parser("note", function(i, line, block, file){
 var values = line.match(/\s*?(?:\{(!*)\})\s*(?:-?\s*(.*))/) || false;
 return {
  priority: values[1] ? values[1].replace(/(!!!)/, "high-priority").replace(/(!!)/, "medium-priority").replace(/(!)/, "low-priority") : "normal-priority",
  description: marked(values[2] ? values[2].trim() : dss.getCurrentParserBlock(i, block))
 };
});


// @author Tyler Benton
// complete
dss.parser("access", function(i, line, block, file){
 return line.trim();
});


// @author Tyler Benton
// complete
dss.parser("alias", function(i, line, block, file){
 return marked(line.trim());
});


// @author Tyler Benton
// complete
dss.parser("returns", function(i, line, block, file){
 var line = line.match(/\s*?(?:\{(.*)\})\s*(?:-?\s*(.*))/);
 return {
  type: (line[1]) ? line[1].split(" | ").join(", ") : "-",
  description: line[2] ? marked(line[2]) : "-"
 }
});


// @author Tyler Benton
// complete
dss.parser("arg", function(i, line, block, file, endOfBlock){
 var argRegex = /^\s*(?:\{(.*)\})?\s*(?:(.*)(?=\s-))?\s*(?:-?\s*(.*))?/,
     line = line.match(argRegex);
 return {
  helper: dss.getCodeAfterBlock(file, endOfBlock),
  name: line[2] !== undefined ? line[2] : "",
  type: line[1] ? line[1].split(" | ").join(", ") : "-",
  default: "-",
  description: line[3] ? marked(line[3]) : "-",
  path: null
 };
});


// @author Tyler Benton
// complete
dss.parser("type", function(i, line, block, file, endOfBlock){
 var typeRegex = /\s*?(?:\{(.*)\})\s*(?:-?\s*(.*))/,
     sassVarRegex = /\s*?(\$.*)\:[\s\S]*?\)?;/, // selects sass variables, including maps
     line = line.match(typeRegex),
     code = dss.getCodeAfterBlock(file, endOfBlock),
     sassVar = code.match(sassVarRegex);
 return {
  name: (sassVar[1]) ? sassVar[1] : "No variable was found",
  type: (line[1]) ? line[1].split(" | ").join(", ") : "",
  description: line[2] ? marked(line[2]) : "",
  variable: sassVar[0] ? sassVar[0] : "No variable was found",
  path: null
 };
});


// @author Tyler Benton
// complete
dss.parser("todo", function(i, line, block, file){
 var param = /^\s*(?:\{(.*)\})?\s*(?:([^\s\(\-]+))?\s*(?:\((.*)\))?\s*(?:-?\s*(.*))?/
 var a = param.exec(line),
     assigner = a[2] ? "<a href='slackapi-link'>@" + a[2] + "</a>" : "Who the F is this?",
     assignee = a[3] ? a[3].trim() : "",
     assigneeLink = assigneeLink || [];

 // converts the names into clickable slack links.
 if(assignee !== ""){
  var assignee = assignee.replace(/\s/, "").split(",");
  assignee.forEach(function(person){
   return assigneeLink.push("<a href='slackapi-link'>@" + person + "</a>");
  });
  assignee = assigneeLink.join(", ");
 }

 return {
  priority: a[1] ? a[1].replace(/(!!!)/, "high-priority").replace(/(!!)/, "medium-priority").replace(/(!)/, "low-priority") : "normal-priority",
  assigner: assigner,
  assignee: assignee,
  title: a[4] ? a[4].trim() : "",
  description: marked(dss.getCurrentParserBlock(i, block)) || ""
 };
});


// @author Tyler Benton
dss.parser("requires", function(i, line, block, file){
 return line.replace(/(\(.*)(,\s?)(.*\))/, "$1#{comma}$3").split(",").map(function(obj){
         obj = obj.replace("#{comma}", ", ").trim();
         return obj.substring(0, 1) !== "$" && obj.indexOf("(") === -1 ? obj + "()" : obj;
        });
});


// @author Tyler Benton
dss.parser("state", function(i, line, block, file){
 var values = line.split(' - '),
     states = (values[0]) ? (values[0].replace(":::", ":").replace("::", ":")) : "";
 return {
   name: states,
   escaped: states.replace(":", " :").replace(/\./g, " ").trim(),
   description: (values[1]) ? values[1].trim() : ""
 };
});


// @author Tyler Benton
dss.parser("markup", function(i, line, block, file){
 var state = /\s?\{\$state\}/g, // finds {$state}
     emptyAttributes = /\s?\w*\=((\"|\')\s*?(\"|\')((\s+?(?=\>))?)|((?=\>))|(\s+?(?=\>)))/g, // removes any empty attriblues
     lineRegex = /^\s*(?:\{(.*)\})?\s*(?:\(([^()]*)\))?\s*(?:-?\s*(.*))?/, // finds anything between {}, finds anything between (), finds anything after -
     firstLine = /^.*$/m; // selects the first line.
 var options = {
      code: "true",
      example: "true"
     },
     userOptions = line.match(lineRegex),
     markup = dss.getCurrentParserBlock(i, block).replace(/\\\@/g, "@").replace(/\\\//g, "/");

 var codeExample = userOptions[2] ? userOptions[2].split(",") : "";
 if(codeExample !== ""){
  codeExample.forEach(function(obj){
   obj = obj.trim().split("=");
   return options[obj[0]] = obj[1].replace(/'|"/g, "");
  });
 }

 // Removes the `${state}` and any empty attributes.
 var safeMarkup = markup.replace(state, "").replace(emptyAttributes, ""),
     result = {};

 result.lang = userOptions[1] ? userOptions[1] : "markup";
 result.description = userOptions[3] ? marked(userOptions[3]) : "";
 result.modifier = markup.replace(emptyAttributes, "");
 result.path = null; // This is inserted by the index.js file

 // the two options that will always be added
 result.example = options.example === "true" ? safeMarkup : false,
 result.escaped = options.code === "true" ? safeMarkup.replace(/</g, "&lt;").replace(/>/g, "&gt;") : false,

 // removed because they where already edded to the result
 delete options.example;
 delete options.escaped;
 delete options.code;

 var optionKeys = Object.keys(options);
 for(var i = 0, l = optionKeys.length; i < l; i++){
  var key = optionKeys[i],
      value = options[key];
  result[key] = value;
 }

 return result;
});

// Module exports
if(typeof exports !== 'undefined'){
 if(typeof module !== 'undefined' && module.exports){
  exports = module.exports = dss;
 }
 exports.dss = dss;
}else{
 root["dss"] = dss;
}

// AMD definition
if(typeof define === 'function' && define.amd){
 define(function(require){
  return dss;
 });
}