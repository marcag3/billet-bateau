#!/bin/sh
set -eu

if [ -z "${PS_JWT_SECRET:-}" ]; then
    echo "PS_JWT_SECRET is required" >&2
    exit 1
fi

if [ -z "${PS_JWT_SECRET_B64URL:-}" ]; then
    PS_JWT_SECRET_B64URL="$(node -e "process.stdout.write(Buffer.from(process.env.PS_JWT_SECRET, 'utf8').toString('base64url'))")"
    export PS_JWT_SECRET_B64URL
fi

exec node /app/service/lib/entry.js "$@"
