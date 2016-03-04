// export default {
//   access: require('./access.js'),
//   alias: require('./alias.js'),
//   arg: require('./arg.js'),
//   author: require('./author.js'),
//   blockinfo: require('./blockinfo.js'),
//   chainable: require('./chainable.js'),
//   deprecated: require('./deprecated.js'),
//   description: require('./description.js'),
//   markdown: require('./markdown.js'),
//   markup: require('./markup.js'),
//   name: require('./name.js'),
//   note: require('./note.js'),
//   page: require('./page.js'),
//   'raw-code': require('./raw-code.js'),
//   readonly: require('./readonly.js'),
//   requires: require('./requires.js'),
//   returns: require('./returns.js'),
//   since: require('./since.js'),
//   states: require('./states.js'),
//   throws: require('./throws.js'),
//   todo: require('./todo.js'),
//   type: require('./type.js'),
//   version: require('./version.js'),
// }



export access from './access'
export alias from './alias'
export arg from './arg'
export author from './author'
export blockinfo from './blockinfo'
export chainable from './chainable'
export deprecated from './deprecated'
export description from './description'
export markdown from './markdown'
export markup from './markup'
export name from './name'
export note from './note'
export page from './page'
export type from './type'
module.exports['raw-code'] = require('./raw-code.js')
export readonly from './readonly'
export requires from './requires'
export returns from './returns'
export since from './since'
export states from './states'
export throws from './throws'
export todo from './todo'
export version from './version'
