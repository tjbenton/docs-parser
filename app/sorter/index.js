import { is, to } from '../utils'
import get_pages from './pages'
import get_nav from './nav'

/// @name sort
/// @description
/// Sorts the parsed data into pages and creates the navigation
/// @arg {object}
/// @returns {object}
export default function sorter(options = {}) {
  let pages = get_pages(options)


  let nav = get_nav(pages)

  return {
    nav,
    pages
  }
}