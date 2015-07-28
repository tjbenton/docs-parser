/// @name author
/// @page annotations
/// @description A note about the documented item
export default function author(){
 return this.annotation.line || this.annotation.contents;
};