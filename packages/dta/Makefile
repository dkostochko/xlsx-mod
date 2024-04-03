.PHONY: build
build: node browser types

.PHONY: clean
clean:
	rm dist/dta.*

## Types
.PHONY: types
types: dta.ts
	tsc -d --emitDeclarationOnly --declarationDir types $<
	mv types/dta.d.ts types/index.d.ts

## NodeJS target

.PHONY: node
node: dist/dta.js

dist/dta.js: dta.ts
	npx esbuild@0.14.14 $< --bundle --outfile=$@ --platform=node

.PHONY: test-node
test-node: dist/dta.js test.js
	npx mocha@2.5.3 test.js

## Browser target
.PHONY: browser
browser: dist/dta.min.js

dist/dta.min.js: dta.ts
	npx esbuild@0.14.14 $< --bundle --outfile=$@ --minify --sourcemap --global-name=DTA

dist/dta.mjs: dta.ts
	npx esbuild@0.14.14 $< --bundle --outfile=$@ --minify --sourcemap --format=esm

