import { is, to } from '../utils'

// placeholder for the result
let result = {}

/// @name pages
/// @description
/// This function loops over the json that was passed and creates a organized structure
/// based on the `@pages` annotations that were passed.
export default function pages(options = {}) {
  let { json, debug, warning, page_fallback, log } = options

  for (let { path, header, body } of to.object_entries(json, 'path')) {
    log.emit('file', path)

    if (!is.empty(header)) {
      if (is.falsy(header.page)) {
        if (is.truthy(page_fallback)) {
          header.page = [page_fallback]
        } else {
          log.emit('warning', `
            Header comment ${header.name && '(' + header.name + ')'} doesn't have a \`@page\` defined in
            ${path}
          `)
        }
      }

      // a) Set the name in the header to be the name of the file
      if (is.falsy(header.name)) {
        log.emit('warning', `
         The hardest thing in development is naming but you gotta try, add a '@name' to the header comment in
         ${path}
        `)
      }

      // set the header for the file
      for (let page of header.page) set(page, 'header', header)
    }

    if (!is.empty(body)) {
      for (let block_in_body of body) {
        let { __start, __end, ...block } = block_in_body
        // warn the user that there isn't a page defined.
        if (is.all.empty(header.page, block.page)) {
          log.emit('warning', `
            ${block.name || 'a block'} starting on line ${__start} doesn't have a \`@page\` defined in
            ${path}
          `)
        }

        // add the block to each page in the header
        if (header.page) {
          for (let page of header.page) {
            set(page, 'body', block)

            let index = (body.page || []).indexOf(page)

            // remove the page from the body comment
            if (index > -1) block.page.splice(index, 1)
          }
        }

        // add the block to each page in the block
        if (block.page && !is.empty(block.page)) {
          for (let page of block.page) set(page, 'body', block)
        }
      }
    }
  }

  return result
}


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

  let pages = result
  // convert to array, and filter out empty strings
  let path_list = path.split('/').filter(Boolean)

  // 1 less than the link so the last item in the `path_list` is what
  // the passed value will be set to
  let length = path_list.length - 1

  // loop over all the pages in in the `path_list` except the
  // last one and create the `page`, and `nav` if they don't exist.
  for (let i = 0; i < length; i++) {
    let page = path_list[i]
    if (!pages[page]) {
      pages[page] = {
        page: {
          header: {},
          body: []
        }
      }
    }
    pages = pages[page]
  }

  // a) Define the default data set(can't use `page` because it will be overwritten)
  if (!pages[path_list[length]]) {
    pages[path_list[length]] = {
      page: {
        header: {},
        body: []
      }
    }
  }

  if (type === 'header') {
    pages[path_list[length]].page.header = to.merge(pages[path_list[length]].page.header, value)
  } else {
    pages[path_list[length]].page.body.push(value)
  }
}