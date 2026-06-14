<?php

namespace Tests\Feature;

use Tests\TestCase;

class AppServiceWorkerScriptTest extends TestCase
{
    public function test_build_outputs_service_worker_with_build_relative_precache_urls(): void
    {
        $path = public_path('build/app-sw.js');

        if (! is_file($path)) {
            $this->markTestSkipped('Frontend build required (public/build/app-sw.js missing).');
        }

        $contents = file_get_contents($path);

        $this->assertIsString($contents);
        $this->assertStringContainsString('"url":"assets/', $contents);
        $this->assertStringNotContainsString('"/app/assets/', $contents);
    }
}
