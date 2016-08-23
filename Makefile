build:
	./scripts/build.sh

test: build
	docker run -t app:build sh -c "npm test"

compose_build:
	docker-compose build

up: build compose_build
	docker-compose up

upd: build compose_build
	docker-compose up -d
