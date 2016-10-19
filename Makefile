build:
	./scripts/build.sh

test: build
	docker run app:build npm run test:mocha

lint: build
	docker run app:build npm run test:lint

check: build
	docker run app:build npm test

compose_build: build
	docker-compose build

up: compose_build
	docker-compose up

upd: compose_build
	docker-compose up -d
