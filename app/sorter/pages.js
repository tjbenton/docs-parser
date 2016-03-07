/* eslint-disable complexity, max-depth */
import { is, to } from '../utils'
import clor from 'clor'

/// @name pages
/// @description
/// This function loops over the json that was passed and creates a organized structure
/// based on the `@pages` annotations that were passed.
export default function pages(options = {}) {
  // placeholder for the result
  let result = {}

  let { json, page_fallback, log } = options

  for (let { path, header, body } of to.objectEntries(json, 'path')) {
    if (!is.empty(header)) {
      if (is.falsy(header.page)) {
        if (is.truthy(page_fallback)) {
          header.page = [ page_fallback ]
        } else {
          log.emit('warning', `
            Header comment ${header.name && '(' + header.name + ')'} doesn't have a ${clor.bold('@page')} defined in
            ${path}
          `)
        }
      }

      // a) Set the name in the header to be the name of the file
      if (is.falsy(header.name)) {
        log.emit('warning', '' +
          'The hardest thing in development is naming but you gotta try, add a ' +
          clor.bold('@name') +
          ' to the header comment in ' +
          clor.bold(path)
        )
      }

      // set the header for the file
      for (let page of header.page) set(page, 'header', header)
    }

    if (!is.empty(body)) {
      for (let block of body) {
        // warn the user that there isn't a page defined.
        if (is.all.empty(header.page, block.page)) {
          log.emit('warning', `
            ${block.name || 'a block'} starting on line ${block.__start} doesn't have a \`@page\` defined in
            ${path}
          `)
        }

        // add the block to each page in the header
        if (header.page) {
          for (let page of header.page) {
            set(page, 'body', block)

            let index = (body.page || []).indexOf(page)

            // remove the page from the body comment
            if (index > -1) {
              block.page.splice(index, 1)
            }
          }
        }

        // add the block to each page in the block
        if (block.page && !is.empty(block.page)) {
          for (let page of block.page) set(page, 'body', block)
        }
      }
    }
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

    let obj = result
    // convert to array, and filter out empty strings
    let path_list = path.split('/').filter(Boolean)

    // 1 less than the link so the last item in the `path_list` is what
    // the passed value will be set to
    let length = path_list.length - 1

    // loop over all the pages in in the `path_list` except the
    // last one and create the `page`, and `nav` if they don't exist.
    for (let i = 0; i < length; i++) {
      let page = path_list[i]
      if (!obj[page]) {
        obj[page] = {
          page: {
            header: {},
            body: []
          }
        }
      }
      obj = obj[page]
    }

    // a) Define the default data set(can't use `page` because it will be overwritten)
    if (!obj[path_list[length]]) {
      obj[path_list[length]] = {
        page: {
          header: {},
          body: []
        }
      }
    }

    if (type === 'header') {
      obj[path_list[length]].page.header = to.merge(obj[path_list[length]].page.header, value)
    } else {
      obj[path_list[length]].page.body.push(value)
    }
  }

  return result
}
