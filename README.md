# Project setup

This sets up the structure of the project and it also has the build tools already pre defined.


The build tool that is being used is [gulp](http://gulpjs.com/). Basically it makes your life easier.

# Getting Started

#### Global dependencies
If you don't have Node installed please see someone who has a clue. If you proceed to install node through their website, I might shank you.

Install global dependencies: `npm i -g gulp`(npm install --global gulp)
To check if it's installed: `npm list -g gulp`

#### Install dependencies

First make sure you're on the same file level as `package.json` aka the root of your project.

Run the following to install the node packages, install the bower components, and combine all the bower packages into a combined.js file.

```bash
npm run setup
```

### Tada your done, and ready to start changing the world.

**Note:** If you are updated your project you will want to run

```bash
npm run fresh-setup
```

# Writing SCSS

## The Namespaces

In no particular order, here are the individual namespaces and a brief description. We’ll look at each in more detail in a moment, but the following list should acquaint you with the kinds of thing we’re hoping to achieve.

 - `o-`: Signify that something is an Object, and that it may be used in any number of unrelated contexts to the one you can currently see it in. Making modifications to these types of class could potentially have knock-on effects in a lot of other unrelated places. Tread carefully.
 - `c-`: Signify that something is a Component. This is a concrete, implementation-specific piece of UI. All of the changes you make to its styles should be detectable in the context you’re currently looking at. Modifying these styles should be safe and have no side effects.
 - `u-`: Signify that this class is a Utility class. It has a very specific role (often providing only one declaration) and should not be bound onto or changed. It can be reused and is not tied to any specific piece of UI. You will probably recognise this namespace from libraries and methodologies like SUIT.
 - `t-`: Signify that a class is responsible for adding a Theme to a view. It lets us know that UI Components’ current cosmetic appearance may be due to the presence of a theme.
 - `s-`: Signify that a class creates a new styling context or Scope. Similar to a Theme, but not necessarily cosmetic, these should be used sparingly—they can be open to abuse and lead to poor CSS if not used wisely.
 - `is-`, `has-`: Signify that the piece of UI in question is currently styled a certain way because of a state or condition. This stateful namespace is gorgeous, and comes from SMACSS. It tells us that the DOM currently has a temporary, optional, or short-lived style applied to it due to a certain state being invoked.
 - `_`: Signify that this class is the worst of the worst—a hack! Sometimes, although incredibly rarely, we need to add a class in our markup in order to force something to work. If we do this, we need to let others know that this class is less than ideal, and hopefully temporary (i.e. do not bind onto this).
 - `js-`: Signify that this piece of the DOM has some behaviour acting upon it, and that JavaScript binds onto it to provide that behaviour. If you’re not a developer working with JavaScript, leave these well alone.
 - `qa-`: Signify that a QA or Test Engineering team is running an automated UI test which needs to find or bind onto these parts of the DOM. Like the JavaScript namespace, this basically just reserves hooks in the DOM for non-CSS purposes.


# API

## Compiling SCSS/CSS

These are the gulp tasks available for all `*.{scss, sass}` files.

The build process for the CSS files is pretty straight forward.

 1. Compiles the scss to css
 2. Combines all the media queries so you don't have 2 of the same media queries in the same file
 3. Adds the nessissary prefixes(this allows you to focus on the code not the prefixes).
 4. Outputs it to `lib/css/**/*.css`
 5. Creates a minified version `lib/css/**/*.min.css`

In the examples below I'm going to use `compass`, but you can use any one of these aliases to do the same thing `styles`, `sass`, `scss`.

###### Options

Arg                            | Description
-------------------------------|-------------------------
`-w, --watch, watch`           | This will watch all the SCSS files for changes including subfolders.
`-d, --folder [FOLDER_NAME]`   | This narrows the scope to a specific folder @remove
`-f, --file [FILE_NAME]`       | This narrows the scope to a specific file @remove
`-p, --path [PATH]`            | This narrows the scope to what you specified.
`-l`, `--live`, `--production` | Strips out any debuging code, as well as source map references
`--stats`                      | This will output stats about the file(s)

###### Examples

``` bash
# Compiles all the files **/*.scss
gulp styles

# Watches all the files **/*.scss for changes
gulp styles --watch
gulp styles -w

# compiles only the main file
# if there isn't a file extention then ".{scss, sass}" is appended (doesn't apply to --path or -p)
gulp styles --file main
gulp styles --file main.scss
gulp styles -f main.scss
gulp styles -f main
gulp styles --path main.scss
gulp styles -p main.* # the star is to select all file types
gulp styles -p main.{scss, sass} # this allows you to specify multiple files types

# compiles all the files inside of pages (`pages/**/*.{scss, sass}`)
gulp styles --folder pages
gulp styles -d pages
gulp styles --path pages/**/* # `**/*` includes all subfolders and files
gulp styles -p pages/**/*


# compiles search.scss inside of pages (`pages/search.scss`)
gulp styles --folder pages --file search.scss
gulp styles -d pages -f search.scss
gulp styles --path pages/search.*
gulp styles -p pages/search.scss

# watch changes for all the files in pages
gulp styles --watch --folder pages

# watch changes to search.scss in pages
gulp styles --watch --folder pages --file search.scss

# watch changes to search.scss in pages
gulp styles --watch --path pages/search.scss

# compiles the css and removes sourcemap references
gulp styles -l
gulp styles --live
gulp styles --production

# this will compile the css and then give you some stats about it
gulp styles --stats
```

Style stats


## JS

Our JS is setup very similar to how our SASS is. You can now include partials(aka any file that starts with `_`) into any main file(aka any file that **doesn't** start with a `_`). Sourcemaps for these files will be generated to make debuging easy.

**Note:** There should never be `.min.js` files in `app/lib/js/`. The `.min.js` files are created and put in `dest/lib/js`

### How to include js files.

You can add an array of files, normal glob rules apply so you can add multiple files and you can add folders and their sub folders.

```js
//= include ["helpers/_clamp.js", "components/*.js"]
```



###### Options

Arg                            | Description
-------------------------------|-------------------------
`-w`, `--watch`                | This will watch all the JS files for changes including subfolders.
`-l`, `--live`, `--production` | Strips out any debuging code, as well as source map references


These are the gulp tasks available for `*.js` files

###### Examples

``` bash
gulp js # updates/creates a minified version of the js file as well as adds source maps
gulp js:clean # removes all js files from `dest/`
gulp js:hint # this will make sure each js file is formated correctly in app.js

gulp bower # this combines all of the bower js libs together (modernizer, jquery)
gulp bower:clean # removes the `combined.js` file from
```



## Images

###### Examples

``` bash
gulp images # Optimize any image that is changed/added in `app/lib/images`, and copys images to `dest/lib/images/`

gulp images:clean # removes all images from `dest/lib/images`
```

## HTML

###### Examples

``` bash
gulp html # copys all html files over to `dest/lib/images`

gulp html:clean # removes all html files from `dest/lib/images`
```

## Fonts

###### Examples

``` bash
gulp fonts # copys all html files over to `dest/lib/images/fonts`

gulp fonts:clean # removes all font files from `dest/lib/images/fonts`
```

## Clean

Removes `./dest/` and `./dest.zip`

###### Examples

``` bash
gulp clean
```

## Zip

Creates a zip file of `dest/`

###### Examples

``` bash
gulp zip
```

## Watch

###### Options

Arg                            | Description
-------------------------------|-------------------------
`-w`, `--watch`                | This will watch for changes in all the files in `app/` and run the correct task for each filetype.
`-s`, `--serve`                | This will start a local server pointing to `dest/`
`-l`, `--live`, `--production` | This will remove all debug statements from the js, and remove all the css comments
###### Examples

``` bash
gulp watch

gulp watch -s
gulp watch --serve

gulp -l
gulp --live
gulp --production
```


## Default

This will run `styles`, `js`, `images`, `fonts`, and `html`

``` bash
gulp
```


## Docs

###### Options

Arg                            | Description
-------------------------------|-------------------------
`-w`, `--watch`                | This will watch for changes in all the files in `app/`, `docs/` and run the correct task for each filetype.
`-s`, `--serve`                | This will start a local server pointing to `docs/`, and do the same as `--watch`

```bash
gulp docs

gulp docs --serve
```
## Things to look into adding
 * page speed insights
 * scss-lint
 * ES6 to ES5 transpiler


