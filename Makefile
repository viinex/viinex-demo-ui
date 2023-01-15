all: env build

env:
	npm update
	cp autobahn-browser.d.ts node_modules/autobahn-browser/index.d.ts

build:
	sh -c "export NODE_OPTIONS=--openssl-legacy-provider; npx ng build  --configuration production --progress false"



clean:
	rm -rf dist
