## Stylus
*Reference: [https://learnboost.github.io/stylus/docs/comments.html](https://learnboost.github.io/stylus/docs/comments.html)

In brief, there are 2 different ways to comment in Stylus:

1. type1: Using `/*` `*/`
2. type2: Using multiple single-line comments, `//`

These are explained in detail below.

### stylus-type1.styl
> For this type, comments *normally* begin with `/*` and end with `*/`, with `*` on each new line in between. *File-level* comments contain five `*` instead of one. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Stylus comment with `/*` and `*/`:

	/*****
	*
	* stuff
	*
	*****/

A *normal* multi-line Stylus comment with `/*` and `*/`:

	/*
	 * stuff
	*/

----------------------------------
### stylus-type2.styl
> For this type, comments are composed of several single lined comments, which are made from `//`. *File-level* comments will begin with five `/`, followed by  single line comments with three `/`, and ended with five more `/` on a new line. Furthermore, *normal* multi-line comments also feature three `/`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Stylus comment with `/` :

	/////
	///
	/// stuff
	///
	/////

A *normal* multi-line Stylus comment with `/` :
	
	///
	/// stuff
	///

A *normal* single-line Stylus comment with `/` :

	// stuff
