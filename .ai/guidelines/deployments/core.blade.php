# Deployment

Production runs from `deploy/compose.yaml` (server setup lives in `deploy/.env.example`) and its database is live. To change the schema, add a new migration with `php artisan make:migration`. Migrations that have already run in production stay as they are.
