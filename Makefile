BIN = $(PWD)/node_modules/.bin/

all: es6

# es6: lib
#   @mkdir -p build/
#   @for path in src/*.js; do \
#     file=`basename $$path`; \
#     $(BIN) "build/$$file" > "build/$$file"; \
#   done


# Compile ES6 from `src` to ES5 in `dist`
# =======================================

dist:
	rm -rf build && $(BIN)babel app -d build

# Development
# ===========

develop:
	$(BIN)babel-node $@

# Publish package to npm
# @see npm/npm#3059
# =======================

publish: all
	npm publish

# Release, publish
# ================

# "patch", "minor", "major", "prepatch",
# "preminor", "premajor", "prerelease"
VERS ?= "patch"
TAG  ?= "latest"

release: all
	npm version $(VERS) -m "Release %s"
	npm publish --tag $(TAG)
	git push --follow-tags

# Tools
# =====

rebuild:
	rm -rf node_modules
	npm install