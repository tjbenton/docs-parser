###
## @author Tyler Benton
## @page tests/coffee-file
###


## @name main
## @description
## main method
outer = 1
changeNumbers = ->
  inner = -1
  outer = 10
inner = changeNumbers()


## @name Something
## @description
## This is a normal multi-line comment.
mood = greatlyImproved if singing

if happy and knowsIt
  clapsHands()
  chaChaCha()
else
  showIt()

date = if friday then sue else jill


## @name Something else
## @description
## This is another normla multi-line comment.
yearsOld = max: 10, ida: 9, tim: 11

ages = for child, age of yearsOld
  "#{child} is #{age}"

  # This a normal single-line comment.