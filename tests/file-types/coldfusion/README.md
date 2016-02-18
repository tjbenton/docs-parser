## Colfusion Script and HTML
*Reference: [http://www.learncfinaweek.com/week1/Commenting/](http://www.learncfinaweek.com/week1/Commenting/)*

In brief, the following are ways to comment in Coldfusion:

1. Coldfusion HTML: Using `<!---` `--->`
2. Coldfusion Script type1: Using `/*`
3. Coldfusion Script type2: Using multiple single line comments, `//`

### coldfusionHtml.cfm
> For this type, comments *normally* begin with `<!---` and end with `--->`. *File-level* comments contain six `-` instead of 3. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Coldfusion HTML comment:

	<!------
	stuff
	------->

A *normal* multi-line Coldfusion HTML comment:

	<!---
	stuff
	--->

----------------------------------
### coldfusionScript-type1.cfm
> For this type, comments *normally* begin with `/*` and end with `*/`. *File-level* comments contain five `*` instead of one. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Coldfusion Script comment with `/*` and `*/` :

	/*****
		stuff
	*****/

A *normal* multi-line Coldfusion Script comment with `/*` and `*/`:

	/*
		stuff
	*/

----------------------------------
### coldfusionScript-type2.cfm
> For this type, comments are composed of several single lined comments, which are made from `//`. *File-level* comments will begin with five `/`, followed by three `/` on each new line, and ended with five more `/` on a new line. *Normal* multiline comments also have three `/` instead of the normal two. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Coldfusion Script comment with `/` :

	////
	///
	/// stuff
	///
	////

A *normal* multi-line Coldfusion Script comment with `/`:

	///
	/// stuff
	///

A *normal* single-line Colfusion Script comment with `/`:

	// stuff
