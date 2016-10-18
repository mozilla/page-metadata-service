build:
	./scripts/build.sh

test: build
	docker run -t app:build npm run test:mocha

lint: build
	docker run -t app:build npm run test:lint

check: build
	docker run -t app:build npm test

compose_build:
	docker-compose build

up: build compose_build
	docker-compose up

upd: build compose_build
	docker-compose up -d
