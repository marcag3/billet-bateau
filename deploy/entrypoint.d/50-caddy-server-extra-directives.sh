#!/bin/sh

if [ -z "${CADDY_SERVER_EXTRA_DIRECTIVES:-}" ] && [ -f /etc/caddy/server-extra-directives ]; then
    export CADDY_SERVER_EXTRA_DIRECTIVES="$(cat /etc/caddy/server-extra-directives)"
fi
