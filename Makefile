build:
	docker-compose build

test: build
	docker-compose run app sh -c "npm test"

up: build
	docker-compose up
