#!/bin/sh
set -eu

# Electric needs REPLICATION + SELECT + CREATE on the database so it can
# create publication electric_publication_default on first start.
# https://electric-sql.com/docs/guides/postgres-permissions
#
# Local app migrations run as POSTGRES_USER (root by default). Granting that
# role to electric lets snapshot operations read owner-protected tables.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	DO \$\$
	BEGIN
	    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'electric') THEN
	        CREATE ROLE electric WITH LOGIN PASSWORD 'password' REPLICATION;
	    ELSE
	        ALTER ROLE electric WITH REPLICATION;
	    END IF;
	END
	\$\$;

	GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO electric;
	GRANT CREATE ON DATABASE "$POSTGRES_DB" TO electric;
	GRANT "$POSTGRES_USER" TO electric;
	GRANT USAGE ON SCHEMA public TO electric;
	GRANT SELECT ON ALL TABLES IN SCHEMA public TO electric;
	GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO electric;

	ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO electric;
	ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO electric;
EOSQL
