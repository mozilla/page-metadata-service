./scripts/echo_version_json.sh > ./app/version.json
docker build -t app:build app/
