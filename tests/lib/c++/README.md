## C++
*Reference: [https://msdn.microsoft.com/en-us/library/wfwda74e.aspx](https://msdn.microsoft.com/en-us/library/wfwda74e.aspx), [https://en.wikibooks.org/wiki/C%2B%2B_Programming/Code/Style_Conventions/Comments](https://en.wikibooks.org/wiki/C%2B%2B_Programming/Code/Style_Conventions/Comments), [http://rbwhitaker.wikidot.com/c-sharp-comments](http://rbwhitaker.wikidot.com/c-sharp-comments)

In brief, there are 2 different ways to comment in C++:

1. type1: Using `/*` `*/`
2. type2: Using multiple single-line comments, `//`

These are explained in detail below.

### c++-type1.c
> For this type, comments *normally* begin with `/*` and end with `*/`. *File-level* comments contain five `*` instead of one. Also, on each new line (for *file-level* and *normal*), there is a `*`. However, this is not necessary. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line C++ comment with `/*` and `*/` :

	/*****
	* 
	* stuff
	*
	*****/

A *normal* multi-line C++ comment with `/*` and `*/` :

	/*
	* stuff
	*/

Another *normal* multi-line C++ comment with `/*` and `*/` :

	/*
	stuff
	*/

----------------------------------
### c++-type2.c
> For this type, comments are composed of several single lined comments, which are made from `//`. *File-level* comments will begin with five `/`, followed by  single line comments with three `/`, and ended with five more `/` on a new line. Furthermore, *normal* multi-line comments also feature three `/`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line C++ comment with `/` :

	/////
	///
	/// stuff
	///
	/////

A *normal* multi-line C++ comment with `/` :
	
	///
	/// stuff
	///

A *normal* single-line C++ comment with `/` :

	// stuff