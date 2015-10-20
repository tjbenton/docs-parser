import { to } from './utils'

////
/// @name Annotations
/// @page annotations
/// @description
/// These are the default annotations for the docs
////
const annotations = {
  /// @name access
  /// @description Access of the documented item
  /// @returns {string}
  access: {
    callback() {
      return this.annotation.line;
    }
  },

  /// @name alias
  /// @description Whether the documented item is an alias of another item
  /// @returns {string}
  alias: {
    callback() {
      return this.annotation.line;
    }
  },

  /// @name arg
  /// @page annotations
  /// @description Parameters from the documented function/mixin
  /// @note Description runs through markdown
  /// @returns {object}
  arg: {
    alias: ['argument', 'param', 'parameter'],
    callback() {
      // add regex for `{type} name-of-variable [default value] - description`
      // make sure it supports multiple lines
      return this.annotation.line;
    }
  },

  /// @name author
  /// @page annotations
  /// @description Author of the documented item
  /// @returns {string}
  author: {
    callback() {
      return this.annotation.line.split(',').map((author) => author.trim()).filter(Boolean)
    }
  },

  /// @name chainable
  /// @page annotations
  /// @description Used to notate that a function is chainable
  /// @returns {boolean}
  chainable: {
    callback() {
      return this.annotation.line;
    }
  },

  /// @name deprecated
  /// @page annotations
  /// @description Lets you know that a mixin/function has been depricated
  /// @returns {string}
  deprecated: {
    callback() {
      // add regex for `{version} - description`
      return this.annotation.line;
    }
  },

  /// @name description
  /// @page annotations
  /// @description Description of the documented item
  /// @note Runs through markdown
  /// @returns {string}
  description: {
    callback() {
      return to.markdown(this.annotation.line ? this.annotation.line + '\n' + this.annotation.contents : this.annotation.contents)
    }
  },

  /// @name markup
  /// @page annotations
  /// @description Code for the documented item
  /// @note Description is parsed as markdown
  /// @returns {object}
  markup: {
    callback() {
      // add regex for `{language} [settings] - description`
      return this.annotation.contents;
    }
  },

  /// @name name
  /// @page annotations/name
  /// @description Name of the documented item
  /// @returns {string}
  name: {
    alias: ['title', 'heading']
  },
  /// @name note
  /// @page annotations
  /// @description A note about the documented item
  /// @returns {object}
  note: {
    callback() {
      // add regex for `{7} - A note`
      return this.annotation.line;
    }
  },

  /// @name page
  /// @page annotations
  /// @description The page you want the documented item to be on
  /// @returns {string}
  page: {
    alias: ['group'],
    callback() {
      return [this.annotation.line];
    }
  },

  /// @name readonly
  /// @page annotations
  /// @description To note that a property is readonly
  /// @returns {boolean}
  readonly: {
    callback() {
      return this.annotation.line;
    }
  },

  /// @name requires
  /// @page annotations
  /// @description Requirements from the documented item
  /// @returns {object}
  requires: {
    alias: ['require'],
    callback() {
      // add regex for {type} item - description
      return this.annotation.line;
    }
  },

  /// @name returns
  /// @page annotations
  /// @description Return from the documented function
  /// @returns {string}
  returns: {
    alias: ['return'],
    callback() { // return
      // add regex for `{type} - description`. Also ensure it supports multiple lines
      return this.annotation.line;
    }
  },

  /// @name since
  /// @page annotations
  /// @description Let's you know what version of the project a something was added
  /// @returns {string}
  since: {
    callback() {
      // add regex for `{type} - description`
      return this.annotation.line;
    }
  },

  /// @name state
  /// @page annotations
  /// @description A state of a the documented item
  /// @returns {object}
  state: {
    callback() {
      // add regex for `modifier - description`
      // should consider supporting multiple lines
      // should `modifier` change to be `{modifier}` since it's sorta like `type`?
      return this.annotation.line;
    }
  },

  /// @name todo
  /// @page annotations
  /// @description Things to do related to the documented item
  /// @returns {object}
  todo: {
    callback() {
      // add regex for {5} [assignee-one, assignee-two] - Task to be done
      // make sure it supports multiple lines
      return this.annotation.line;
    }
  },

  /// @name type
  /// @page annotations
  /// @description Describes the type of a variable
  /// @returns {string}
  type: {
    callback() {
      // add regex for `{type} - description`
      return this.annotation.line;
    }
  },

  /// @name version
  /// @page annotations
  /// @description Describes the type of a variable
  /// @returns {string}
  version: {
    callback() {
      // add regex for `{type} - description`
      return this.annotation.line;
    }
  }
}

export default annotations