import {is, to} from './utils'

/// @name sort
/// @description
/// Sorts the parsed data into pages and creates the navigation
/// @arg {object}
/// @returns {object}
export default function(json) {
  let nav, pages

  /// @name pages
  /// @description
  /// This function loops over the json that was passed and creates a organized structure
  /// based on the `@pages` annotations that were passed.
  pages = (() => {
    let result = {}
    // @name set
    // @description
    // creates a structure from an array, and adds the passed object to
    // the `base` array if it was passed.
    //
    // @returns {object} - The nested object with the set value
    function set(path, type, value) {
      // ensures values won't change in the passed value
      value = to.clone(value)

      // deletes the page from the value so it
      // won't get added to the data
      delete value.page

      let _pages = result
      // convert to array, and filter out empty strings
      let path_list = path.split('/').filter(Boolean)

      // 1 less than the link so the last item in the `path_list` is what
      // the passed value will be set to
      let length = path_list.length - 1

      // loop over all the pages in in the `path_list` except the
      // last one and create the `page`, and `nav` if they don't exist.
      for (let i = 0; i < length; i++) {
        let page = path_list[i]
        if (!_pages[page]) {
          _pages[page] = {
            page: {
              header: {},
              body: []
            }
          }
        }
        _pages = _pages[page]
      }

      // a) Define the default data set(can't use `page` because it will be overwritten)
      if (!_pages[path_list[length]]) {
        _pages[path_list[length]] = {
          page: {
            header: {},
            body: []
          }
        }
      }

      if (type === 'header') {
        _pages[path_list[length]].page.header = to.merge(_pages[path_list[length]].page.header, value)
      } else {
        _pages[path_list[length]].page.body.push(value)
      }
    }

    // loop over each filetype in the json object to create the pages structure
    for (let [filetype, files] of to.entries(json)) {
      // loop over each file in the filetype object
      for (let file of files) {
        // a) Ensures there's only one page defined in the header
        // b) There wasn't a page defined so set it to general
        file.header.page = file.header.page ? file.header.page[0] : 'general'

        // a) Set the name in the header to be the name of the file
        if (is.falsy(file.header.name)) {
          file.header.name = to.case.title(file.info.name)
        }

        // set the header for the file
        set(file.header.page, 'header', file.header)

        // loop over each block in the body of the file
        for (let block of file.body) {
          // a) loop over each page in the block,
          //    and add the block to that page.
          if (block.page) {
            for (let page of block.page) {
              if (page !== file.header.page) {
                set(page, 'body', block)
              }
            }
          }

          // add the block to the page
          set(file.header.page, 'body', block)
        }
      }
    }

    return result
  })()

  /// @name nav
  /// @description
  /// This function builds the navigation based of how the pages were built.
  nav = ((pages) => {
    let result = [] // placeholder to store the result

    /// @name body_names
    /// @description Helper function to get the name of each block in the body
    /// @arg {string} - the href to append the `name` of the block to
    /// @arg {array} - the body of the page
    /// @returns {array}
    function body_names(href, body) {
      let _body_names = []
      // loop over each block in the body
      for (let block of body) {
        // a) Add the name to the body_names
        if (is.existy(block.name)) {
          _body_names.push({
            title: block.name,
            href: `${href}#${to.case.dash(block.name)}`
          })
        }
      }

      return _body_names
    }


    /// @name set
    /// @description
    /// This is a helper function that recursivly goes through the
    /// structure(`a`) creating the navigation structure for
    /// the passed item.
    /// @arg {object} - This is the top level object to continue to drill down.
    /// @arg {object} - The inner structure to continue to loop over.
    /// @returns {object}
    function set(a, b) {
      for (let [key, value] of to.entries(b)) {
        if (key !== 'page') {
          let nav_item = {
            title: is.truthy(value.page.header.name) ? value.page.header.name : to.case.title(to.case.space(key)),
            href: `${a.href}/${key}`,
            body: [],
            subpages: []
          }

          // add the name of each block in the body
          nav_item.body = body_names(nav_item.href, value.page.body)

          // a) Call `set` again because it's not the last level
          if (to.keys(value).length > 1) { // the reason it's `> 1` is because `page` will always be defined.
            nav_item = set(nav_item, value)
          }

          a.subpages.push(nav_item)
        }
      }

      return a
    }

    // loop over the pages structure to create the navigation
    for (let [key, value] of to.entries(pages)) {
      result.push(set({
        title: to.case.title(to.case.space(key)),
        href: `/${key}`,
        body: body_names(`/${key}`, value.page.body),
        subpages: []
      }, value))
    }

    return result
  })(pages)

  return {
    nav,
    pages
  }
}