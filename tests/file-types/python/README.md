## Python
*Reference: [http://www.pythonforbeginners.com/comments/comments-in-python](http://www.pythonforbeginners.com/comments/comments-in-python), [http://www.afterhoursprogramming.com/tutorial/Python/Comments/](http://www.afterhoursprogramming.com/tutorial/Python/Comments/)

In brief, there are 3 different ways to comment in Python:

1. type1: Using `"""`
2. type2: Using `'''`
3. type3: Using multiple single line comments, `#`

These are explained in detail below.

### python-type1.py
> For this type, comments *normally* begin with `"""` and end with `"""`. *File-level* comments contain five `"` instead of three. For style's sake, the `"` are on their own line. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Python comment with `"` :

	"""""
	stuff
	"""""

A *normal* multi-line Python comment with `"` :

	"""
	stuff
	"""

----------------------------------
### python-type2.py
> For this type, comments normally begin with `'''` and end with `'''`. *File-level* comments contain five `'` instead of three. For style's sake, the `'` are on their own line. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Python comment with `'` :
	
	'''''
	stuff
	'''''

A *normal* multi-line Python comment with `'` :

	'''
	stuff
	'''

----------------------------------
### python-type3.py
> For this type, comments are composed of several single lined comments, which are made from `#`. *File-level* comments will begin with five `#`, followed by  single line comments with two `#`, and ended with five more `#` on a new line. Furthermore, *normal* multi-line comments also feature two `#`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Python comment with `#` :

	#####
	##
	## stuff
	##
	#####

A *normal* multi-line Python comment with `#` :
	
	##
	## stuff
	##

A *normal* single-line Python comment with `#` :

	# stuff
