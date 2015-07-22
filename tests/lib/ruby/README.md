## Ruby
Reference: [http://www.tutorialspoint.com/ruby/ruby_comments.htm](http://www.tutorialspoint.com/ruby/ruby_comments.htm)

In brief, there are 2 different ways to comment in Ruby:

1. type1: Using `=begin` `=end`
2. type2: Using multiple single line comments, `#`

These are explained in detail below.

### ruby-type1.rb
> For this type, comments *normally* begin with `=begin` and end with `=end`. *File-level* comments contain five `=` after `begin`. It is important to note that `=begin` and `=end` both start on a new line. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:

A *file-level* multi-line Ruby comment with `=begin` and `=end`:

	=begin=====
	stuff
	=end

A *normal* multi-line Ruby comment with `=begin` and `=end`:

	=begin
	stuff
	=end

----------------------------------
### ruby-type2.rb
> For this type, comments are composed of several single lined comments, which are made from `#`. *File-level* comments will begin with five `#`, followed by  single line comments with two `#`, and ended with five more `#` on a new line. Furthermore, *normal* multi-line comments also feature two `#`. It is up to you how you want to `tab` or `space` stuff inside. The comments are as follows:


A *file-level multi-line* Ruby comment with `#` :

	#####
	##
	## stuff
	##
	#####

A *normal multi-line* Ruby comment with `#` :
	
	##
	## stuff
	##

A *normal single-line* Ruby comment with `#` :

	# stuff
