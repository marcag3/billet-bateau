#!/bin/sh
set -eu

# PowerSync Open Edition needs logical replication plus bucket storage.
# See https://docs.powersync.com/configuration/source-db/setup

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	DO \$\$
	BEGIN
		IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'powersync') THEN
			CREATE ROLE powersync WITH LOGIN PASSWORD 'password' REPLICATION BYPASSRLS;
		ELSE
			ALTER ROLE powersync WITH REPLICATION BYPASSRLS;
		END IF;
	END
	\$\$;

	GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO powersync;
	GRANT USAGE ON SCHEMA public TO powersync;
	GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync;
	GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO powersync;
	ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync;
	ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO powersync;

	DO \$\$
	BEGIN
		IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
			CREATE PUBLICATION powersync FOR ALL TABLES;
		END IF;
	END
	\$\$;
EOSQL

exists="$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -Atc "SELECT 1 FROM pg_database WHERE datname = 'powersync_storage'")"
if [ "$exists" != "1" ]; then
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c 'CREATE DATABASE powersync_storage;'
fi
