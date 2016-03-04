/// @name @access
/// @arg {string} line [public] - public, private, protected
/// @description
/// Access of the documented item. If access isn't declared then it defaults to public.
/// @markup Usage
/// /// @access public
///
/// /// @access private
///
/// /// @access protected
/// @note This is autofilled on every header or body comment
export default {
  autofill() {
    return 'public'
  },
  parse() {
    const line = this.annotation.line
    if (
      line === 'private' ||
      line === 'protected'
    ) {
      return line
    }

    return 'public'
  }
}
