<?php

namespace Tests\Feature;

use Tests\TestCase;

class OctaneCaddyServiceWorkerDirectivesTest extends TestCase
{
    public function test_octane_caddy_env_includes_service_worker_allowed_directives(): void
    {
        $directives = config('octane.caddy.env.CADDY_SERVER_EXTRA_DIRECTIVES');

        $this->assertIsString($directives);
        $this->assertNotSame('', $directives);
        $this->assertStringContainsString('Service-Worker-Allowed', $directives);
        $this->assertStringContainsString('"/app/"', $directives);
        $this->assertStringContainsString('/build/app-sw.js', $directives);
    }
}
