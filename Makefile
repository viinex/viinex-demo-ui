all: env build

env: ngcli
	npm install

ngcli: 
	npm install @angular/cli

NG=node node_modules/@angular/cli/bin/ng

build:
	$(NG) build --prod --aot --progress=false



clean:
	rm -rf dist
