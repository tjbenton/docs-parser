BIN = $(PWD)/node_modules/.bin
GBIN = $(npm -g bin)
# BABEL = [[ -f  $(npm -g bin)/babel ]] && $(npm -g bin)/babel || $(BIN)/babel
BABEL = [[ -d $(npm -g root)/babel ]] && babel || $(BIN)/babel

all: es6

# es6: lib
#   @mkdir -p build/
#   @for path in src/*.js; do \
#     file=`basename $$path`; \
#     $(BIN) "build/$$file" > "build/$$file"; \
#   done


# Compile ES6 from `src` to ES5 in `dist`
# =======================================
run:
	rm -rf build/
	make build

build:
	babel app -d build

postinstall:
	# [[ -d $(npm -g root)/babel ]] || npm i babel
	make build

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