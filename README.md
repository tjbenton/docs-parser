# Docs

<br>
<!-- [![Build Status][travis-image]][travis-url] -->
<!-- [![License][license-image]][license-url] -->

<!-- [![NPM][npm-image]][npm-url] -->

Docs, addapts to any language and will help you document all the things.
Where there is development there is a need for documentation. There are several great libraries for all sorts of files, written by brilliant developers, libraries like [SassDoc](sass-doc), [JSDoc](js-doc), [JavaDoc](java-doc), [Jazzy](jazzy), [StyleDocco](styledocco), [KSS](kss), [Hologram](hologram), [DSS](dss) and several more. All of these libraries do a very good job for documenting their respective languages. However there are very few projects that only require 1 file type. Which means if you really want to document all you code you may have to use 3 or 4 of these documentation generators. Each of the generators have their own way of documenting and their annotations, and their own document site which just makes it harder to keep all your documentation in one spot.
Docs fixes all these issues by giving you the ability to generate documentation for all your files. While giving you control over what annotations you want to use in each file type.

## Table of contents
 - [Settings](#settings)
 - [Parse files](#parse-files)
 - [Adding a annotation](#adding-a-annotation)
 - [Default Annotations](#default-annotations)
 - [Documenting your items](#documenting-your-items)

## Settings
There're 3 different settings that're avaiable to change on a per file basis. When you define out new settings for a specific filetype it will be merged with the default settings.

#### Options
`file_comment`:
  - **Description:** File level comment block identifier
  - **Type:** Object
  - **Default:**
    - `file_comment.start`
      - **Description:** Start of a file level comment block
      - **Default**: `"////"`
    - `file_comment.line`
      - **Description:** Start of each line in a file level comment block
      - **Default**: `"///"`
    - `file_comment.end`
      - **Description:** Last line of a file level the comment block
      - **Default**: `"////"`

`block_comment`:
  - **Description:** block level comment block identifier
  - **Type:** Object
  - **Default:**
    - `block_comment.start`
      - **Description:** Start of a comment block
      - **Default**: `""`
    - `block_comment.line`
      - **Description:** Start of each line in a comment block
      - **Default**: `"///"`
    - `block_comment.end`
      - **Description:** Last line of a file level the comment block
      - **Default**: `""`

`parser_prefix`
  - **Description:** The prefix of the annotation(not recommended to change)
  - **Default:** `"@"`

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



## Adding a annotation

#### `docs.annotation(name, obj)`

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
- `this.default`: This allows you to call the default annotation callback if you specific a specific filetype callback for an annotation. **Note** This is only avaiable on specific filetype callbacks.

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
// Since `default` wasn't defined you can't call it
docs.annotation("content", {
 scss: function(){
  return this.annotation.line || this.annotation.contents;
 }
});
```

###### Adding an different annotation within an annotation
```js
docs.annotation("arg", {
 default: function(){
  // ...code for arg...
  return {
   ...
  }
 },
 scss: function(){
  // ...code for scss specific arg...

  var code = this.code.contents,
      mixin = code.match(/\@mixin\s(.*)(?:\()/),
      func = code.match(/\@function\s(.*)(?:\()/);

  if(mixin[0]){
   this.add("name", mixin[0]);
   this.add("is-mixin", code);
  }else if(func[0]){
   this.add("name", func[0]);
   this.add("is-function", code);
  }

  // the return object for `arg`
  return {
   ...
  }
 }
});
```


## Parse files
#### docs.parse(files)
Docs supports globbing so it makes it easy to parse all of your files.

Returns an object

 - `data`: The data that is returned after the files have been parsed
 - `write`: A function to write the data out to a file
   - `function(location, spacing){ ... }`
   - `location`:
     - **Description:** The location to write the file to
     - **Type:** String
   - `spacing`
     - **Description:** The spacing you want the file to have.
     - **Default:** 1
     - **Type:** Number,`\t`,`\s`
 - `then`: Helper function to allow you to do something with the data after it's parsed before it's written to a file
  - `function(callback){ ... }`
   - `callback`
     - **Description:** It's the callback function you want to run. `this` is applied to the callback`
     - **Default:** 1
     - **Type:** Function
 - `documentize`: Auto documents the files(Hasn't been implemented)
  - `function(location){ ... }`
   - `location`:
     - **Description:** The location to write the documentation to
     - **Type:** String

###### Examples

Write out the data to file **without** adjusting it first.

```js
docs
 .parse("lib/**/*.*")
 .write("docs.json");
```

Manipulate the data before it's written out to a file.

```js
docs
 .parse("lib/**/*.*")
 .then(function(){
  // Change `this.data` to adjust the output
  this.data = "customized data";
 })
 .write("docs.json");
```

The output file will look something like the following. For each filetype that is parsed a new key will be added and the value of that key will be an array of objects for that filetype.

```js
{
 "css": [],
 "scss": [],
 "js": []
}
```

**Note:** To see a more detailed example of the output see `tests/tests.json`.

## Default Annotations
See more on the [default annotations](ANNOTATIONS.md)
 - [name](ANNOTATIONS.md#name)
 - [page](ANNOTATIONS.md#page)
 - [author](ANNOTATIONS.md#author)
 - [description](ANNOTATIONS.md#description)
 - [note](ANNOTATIONS.md#note)
 - [access](ANNOTATIONS.md#access)
 - [alias](ANNOTATIONS.md#alias)
 - [returns](ANNOTATIONS.md#returns)
 - [arg](ANNOTATIONS.md#arg)
 - [type](ANNOTATIONS.md#type)
 - [todo](ANNOTATIONS.md#todo)
 - [requires](ANNOTATIONS.md#requires)
 - [state](ANNOTATIONS.md#state)
 - [markup](ANNOTATIONS.md#markup)

## Documenting your items
There are 2 different types of comment blocks **block level**, and **file level**.

### Block level comment
This type of comment is used multiple times per file.

```scss
/// @author Tyler Benton
/// @page functions/numbers
/// @description
/// This function does something awesome, I swear.
@function some-function(){
  // ...
}
```


### File level comment
This type of comment can only occur **once** per file. Any annotations that are found inside of the file level comment will become the default value for the block level comments. It is very useful when you have a whole file sharing some annotations (@author, @page and so on).

```scss
////
/// @author Tyler Benton
/// @page functions/numbers
/// @description Useful number functions
////

/// @description
/// This item will have: `@page functions/numbers` and `@author Tyler Benton`
/// inherited from the file level comment, but not `@description`
@function some-function(){
  // ...
}

/// @author John Doe
/// @description
/// This item overrides the `@author` annotation
@mixin some-mixin{
  // ...
}
```


<!-- Document Generators -->
[sass-doc]: https://github.com/SassDoc/sassdoc
[js-doc]: https://github.com/jsdoc3/jsdoc
[java-doc]: http://www.oracle.com/technetwork/java/javase/documentation/index-jsp-135444.html
[jazzy]: https://github.com/realm/jazzy
[styledocco]: https://github.com/jashkenas/docco
[kss]: https://github.com/kneath/kss
[hologram]: https://github.com/trulia/hologram
[dss]: https://github.com/DSSWG/DSS

<!-- other -->
[npm-url]: https://www.npmjs.com/package/cameleon
[npm-image]: https://nodei.co/npm/cameleon.png?downloads=true
[travis-url]: https://travis-ci.org/tjbenton/docs?branch=master
[travis-image]: https://travis-ci.org/tjbenton/docs.svg?style=flat-square
[license-image]: http://img.shields.io/npm/l/sassdoc.svg?style=flat-square
[license-url]: LICENSE.md