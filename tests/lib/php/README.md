## php
*Reference: [http://php.net/manual/en/language.basic-syntax.comments.php](http://php.net/manual/en/language.basic-syntax.comments.php)

In brief, there are 3 different ways to comment in php:

1. type1: Using `/*` `*/`
2. type2: Using multiple single-line comments, `//`
3. type3: Using multiple single-line comments, `#`

These are explained in detail below.

### php-type1.php
> For this type, comments *normally* begin with `/*` and end with `*/`. *File-level* comments contain five `*` instead of one. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line php comment with `/*` and `*/` :

	/*****
	stuff
	*****/

A *normal* multi-line php comment with `/*` and `*/`:

	/*
	stuff
	*/

----------------------------------
### php-type2.php
> For this type, comments are composed of several single lined comments, which are made from `//`. *File-level* comments will begin with five `/`, followed by  single line comments with three `/`, and ended with five more `/` on a new line. Furthermore, *normal* multi-line comments also feature three `/`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line php comment with `/` :

	/////
	///
	/// stuff
	///
	/////

A *normal* multi-line php comment with `/` :
	
	///
	/// stuff
	///

A *normal* single-line php comment with `/` :

	// stuff

----------------------------------
### php-type3.php
> For this type, comments are composed of several single lined comments, which are made from `#`. *File-level* comments will begin with five `#`, followed by  single line comments with two `#`, and ended with five more `#` on a new line. Furthermore, *normal* multi-line comments also feature two `#`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line php comment with `#` :

	#####
	##
	## stuff
	##
	#####

A *normal* multi-line php comment with `#` :
	
	##
	## stuff
	##

A *normal* single-line php comment with `#` :

	# stuff
