## Java
*Reference: [http://journals.ecs.soton.ac.uk/java/tutorial/getStarted/application/comments.html](http://journals.ecs.soton.ac.uk/java/tutorial/getStarted/application/comments.html)

In brief, there are 2 different ways to comment in Java:

1. type1: Using `/*` `*/`
2. type2: Using multiple single line comments, `//`

These are explained in detail below.

### java-type1.java
> For this type, comments *normally* begin with `/*` and end with `*/`. *File-level* comments have five `*` instead of one. For style's sake, usually you put a `*` to begin each new comment line. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Java comment with `/*` and `*/` :

	/*****
	* stuff
	* more stuff
	* even more stuff
	*****/

A *normal* multi-line Java comment with `/*` and `*/` :

	/*
	* stuff
	*/

----------------------------------
### java-type2.java
> For this type, comments are composed of several single lined comments, which are made from `//`. *File-level* comments will begin with five `/`, followed by  single line comments with three `/`, and ended with five more `/` on a new line. Furthermore, *normal* multi-line comments also feature three `/`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Java comment with `/` :

	/////
	///
	/// stuff
	///
	/////

A *normal* multi-line Java comment with `/` :
	
	///
	/// stuff
	///

A *normal* single-line Java comment with `/` :

	// stuff