# Docs

<br>
[![Build Status][travis-image]][travis-url]
[![License][license-image]][license-url]

[![NPM][npm-image]][npm-url]

Documentation chameleon, addapts to any language and will help you document all the things.
Where there is development there is a need for documentation. There are several great libraries for all sorts of files, written by brilliant developers, libraries like [SassDoc](sass-doc), [JSDoc](js-doc), [JavaDoc](java-doc), [Jazzy](jazzy)
[StyleDocco](styledocco), [KSS](kss), [Hologram](hologram), [DSS](dss). All of these libraries do a very good job for documenting their respective languages. However there are very few projects that only require 1 file type. Which means if you really want to document all you code you may have to use 3 or 4 of these documentation generators. Each of the generators have their own way of documenting and their annotations, and their own document site which just makes it harder to keep all your documentation in one spot.
Docs fixes all these issues by giving you the ability to generate documentation for all your files. While giving you control over what annotations you want to use in each file type.



## Settings
There're 3 different settings that're avaiable to change on a per file basis. When you define out new settings for a specific filetype it will be merged with the default settings.

#### Example
Defining file specific settings.

```js
// first param is the filetype you want to target, the second is the settings you want to add
docs.setting("css", {
 file_comment: {
  start: "/***",
  line: "*",
  end: "***/"
 },
 block_comment: {
  start: "/**",
  line: "*",
  end: "**/"
 }
});
```

#### Options
 - `file_comment`
   *Description:* File level comment block identifier
   *Type:* Object
   *Default:*
    - `file_comment.start`
      *Description:* Start of a file level comment block
      *Default*: `"////"`
    - `file_comment.line`
      *Description:* Start of each line in a file level comment block
      *Default*: `"///"`
    - `file_comment.end`
      *Description:* Last line of a file level the comment block
      *Default*: `"////"`
 - `block_comment`
   *Description:* block level comment block identifier
   *Type:* Object
   *Default:*
    - `block_comment.start`
      *Description:* Start of a comment block
      *Default*: `""`
    - `block_comment.line`
      *Description:* Start of each line in a comment block
      *Default*: `"///"`
    - `block_comment.end`
      *Description:* Last line of a file level the comment block
      *Default*: `""`
 - `parser_prefix`
   *Description:* The prefix of the annotation(not recommended to change)
   *Default:* `"@"`




## `docs.annotation(name, obj)`

### Adding a annotation

`docs.annotation` expects the name of the variable you're looking for and a callback function to manipulate the contents. Whatever is returned by that callback function is what is used in generate JSON for that comment block.

##### Callback `this`:

- `this.annotation`: Information about the annotation
 - `this.annotation.name`: Name of this annotation
 - `this.annotation.line`: The string that is on the same line as the declared annotation
 - `this.annotation.contents`: The content assosiated with the annotation
 - `this.annotation.start`: Start of the annotation
 - `this.annotation.end`: End of the annotation
- `this.comment`: Information about the current comment block
 - `this.comment.contents`: The content assosiated the comment block
 - `this.comment.start`: Start of the comment block
 - `this.comment.end`: End of the comment block
- `this.code:` Information about the code after the current comment block
 - `this.code.contents`: The code after the current comment block
 - `this.code.start`: Start of the code
 - `this.code.end`: End of the code
- `this.file`: Information about the file the comment block is in
 - `this.file.contents`: The file contents
 - `this.file.path`: Path of the file
 - `this.file.type`: Type of the file
 - `this.file.start`: start of the file(aka `0`)
 - `this.file.end`: Total lines in the file
- `this.add`: Allows you to add other annotations based off of the information in the current annotation callback(see example below)
- this.default: This allows you to call the default annotation callback if you specific a specific filetype callback for an annotation. **Note** This is only avaiable on specific filetype callbacks.

#### Annotation Examples:
###### Defining a basic annotation with only a default callback function

```js
docs.annotation("name", function(){
 return this.annotation.line;
});
```

###### Overwriting an annotation for a specific filetype

```js
docs.annotation("name", {
 default: function(){ // default callback for every other filetype
  return this.annotation.line;
 },
 scss: function(){ // callback for `.scss` files only
  return this.annotation.line + " scss specific";
 }
});
```

###### Writing a file specific annotation only

```js
// This will only be applied to `.scss` files
docs.annotation("content", {
 scss: function(){
  return this.annotation.line || this.annotation.contents;
 }
});
```


## Parse




<!-- Document Generators -->
[sass-doc]: https://github.com/SassDoc/sassdoc
[js-doc]: https://github.com/jsdoc3/jsdoc
[java-doc]: http://www.oracle.com/technetwork/java/javase/documentation/index-jsp-135444.html
[jazzy]: https://github.com/realm/jazzy
[styledocco]: https://github.com/jashkenas/docco
[kss]: https://github.com/kneath/kss
[hologram]: https://github.com/trulia/hologram
[dss]: https://github.com/DSSWG/DSS

<!-- file -->
[npm-url]: https://www.npmjs.com/package/cameleon
[npm-image]: https://nodei.co/npm/cameleon.png?downloads=true
[travis-url]: https://travis-ci.org/tjbenton/docs?branch=master
[travis-image]: https://travis-ci.org/tjbenton/docs.svg?style=flat-square
[license-url]: LICENSE.md