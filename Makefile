all: env build

env: ngcli
	npm install

ngcli: node_modules/@angular/cli/bin/ng
	npm install @angular/cli

NG=node node_modules/@angular/cli/bin/ng

build:
	$(NG) build --prod --aot



clean:
	rm -rf dist
