CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\i /docker-entrypoint-initdb.d/migrations/001-auth-schema.sql
\i /docker-entrypoint-initdb.d/migrations/002-violations-schema.sql
\i /docker-entrypoint-initdb.d/migrations/003-audit.schema.sql
\i /docker-entrypoint-initdb.d/migrations/004-vectors-schema.sql
\i /docker-entrypoint-initdb.d/migrations/005-motor-vehicle-act.sql
\i /docker-entrypoint-initdb.d/migrations/006-analysis-sessions.sql
\i /docker-entrypoint-initdb.d/migrations/007-seed-admin.sql