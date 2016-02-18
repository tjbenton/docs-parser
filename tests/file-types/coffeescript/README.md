## CoffeeScript
*Reference: [http://stackoverflow.com/questions/7781685/coffeescript-how-to-comment-this-doesnt-work](http://stackoverflow.com/questions/7781685/coffeescript-how-to-comment-this-doesnt-work)

In brief, there are 2 different ways to comment in CoffeeScript:

1. type1: Using `###`
2. type2: Using multiple single-line comments, `#`

These are explained in detail below.

### coffeescript-type1.coffee
> For this type, comments *normally* begin with `###` and end with `###`. *File-level* comments contain five `#` instead of three. For style's sake, the `#` are on their own line. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line CoffeeScript comment with `#` :

	#####
	stuff
	#####

A *normal* multi-line CoffeeScript comment with `#` :

	###
	stuff
	###

----------------------------------
### coffeescript-type2.coffee
> For this type, comments are composed of several single lined comments, which are made from `#`. *File-level* comments will begin with five `#`, followed by  single line comments with two `#`, and ended with five more `#` on a new line. Furthermore, *normal* multi-line comments also feature two `#`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line CoffeeScript comment with `#` :

	#####
	##
	## stuff
	##
	#####

A *normal* multi-line CoffeeScript comment with `#` :
	
	##
	## stuff
	##

A *normal* single-line CoffeeScript comment with `#` :

	# stuff
