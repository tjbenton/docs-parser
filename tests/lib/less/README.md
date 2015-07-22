## Less
*Reference: [http://www.ibm.com/developerworks/library/wa-less/](http://www.ibm.com/developerworks/library/wa-less/)

In brief, there are 2 different ways to comment in Less:

1. type1: Using `/*` `*/`
2. type2: Using multiple single line comments, `//`

These are explained in detail below.

### less-type1.less
> For this type, comments *normally* begin with `/*` and end with `*/`. *File-level* comments contain five `*` instead of one. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Less comment with `/*` and `*/`:

	/*****
	stuff
	*****/

A *normal* multi-line Less comment with `/*` and `*/`:

	/*
	stuff
	*/

----------------------------------
### less-type2.less
> For this type, comments are composed of several single lined comments, which are made from `/`. *File-level* comments will begin with five `/`, followed by  single line comments with three `/`, and ended with five more `/` on a new line. Furthermore, *normal* multi-line comments also feature three `/`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Less comment with `/` :

	////
	///
	/// stuff
	///
	////

A *normal* multi-line Less comment with `/` :

	///
	/// stuff
	///

A *normal* single-line Less comment with `/` :

	// stuff
