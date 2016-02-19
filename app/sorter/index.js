import { is, to } from '../utils'
import getPages from './pages'
import getPav from './nav'

/// @name sort
/// @description
/// Sorts the parsed data into pages and creates the navigation
/// @arg {object}
/// @returns {object}
export default function sorter(options = {}) {
  let pages = getPages(options)
  let nav = getPav(pages)

  return {
    nav,
    pages
  }
}
