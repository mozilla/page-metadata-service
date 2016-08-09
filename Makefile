build:
	docker build -t app:build app/

test: build
	docker run -t app:build sh -c "npm test"

compose_build:
	docker-compose build

up: compose_build
	docker-compose up
