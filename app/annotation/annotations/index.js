import {to} from "../../utils";
// Exports out all the annotations in this folder
let result = {},
    annotations = [
     require("./access.js"),
     require("./alias.js"),
     require("./arg.js"),
     require("./author.js"),
     require("./chainable.js"),
     require("./construct.js"),
     require("./deprecated.js"),
     require("./description.js"),
     require("./markup.js"),
     require("./name.js"),
     require("./note.js"),
     require("./page.js"),
     require("./readonly.js"),
     require("./requires.js"),
     require("./returns.js"),
     require("./since.js"),
     require("./state.js"),
     require("./todo.js"),
     require("./type.js"),
     require("./version.js"),
    ];

for(let i in annotations){
 to.extend(result, annotations[i]);
}

module.exports = result;
