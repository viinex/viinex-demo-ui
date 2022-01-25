all: env build

env:
	npm update
	cp autobahn-browser.d.ts node_modules/autobahn-browser/index.d.ts

build:
	npx ng build  --configuration production --progress false



clean:
	rm -rf dist
