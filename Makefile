all: env build

env:
	npm install
	cp autobahn-browser.d.ts node_modules/autobahn-browser/index.d.ts

build: export NODE_OPTIONS=--openssl-legacy-provider

build:
	npx --openssl-legacy-provider ng build --configuration production --progress false



clean:
	rm -rf dist
