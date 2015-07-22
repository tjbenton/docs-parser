###
## @author John Doe
## @name Message Board
## @description
## This is a file-level multi-line comment made of single line comments.
###

## @name main
## @description
## main method

for i in (1..4)
    print i," "
end
print "\n"

## @name Something
## @description
## This is a normal multi-line comment made of single line comments.

for i in (1...4)
    print i," "
end
print "\n"

## @name Something else
## @description
## This is another normal multi-line comment made of single line comments.

items = [ 'Mark', 12, 'goobers', 18.45 ]
for it in items
    print it, " "
end
print "\n"

# A simple single line comment
for i in (0...items.length)
    print items[0..i].join(" "), "\n"
end