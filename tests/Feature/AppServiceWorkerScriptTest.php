<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppServiceWorkerScriptTest extends TestCase
{
    use RefreshDatabase;

    public function test_sw_script_is_served_without_authentication(): void
    {
        User::factory()->create();

        $path = public_path('build/app-sw.js');
        $createdBuildDir = ! is_dir(dirname($path));
        if ($createdBuildDir) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, '// test service worker');

        try {
            $this->get('/app/sw.js')
                ->assertOk()
                ->assertHeader('Content-Type', 'application/javascript; charset=UTF-8');
        } finally {
            if (is_file($path)) {
                unlink($path);
            }

            if ($createdBuildDir) {
                rmdir(dirname($path));
            }
        }
    }

    public function test_sw_script_returns_not_found_when_build_artifact_is_missing(): void
    {
        User::factory()->create();

        $path = public_path('build/app-sw.js');
        $existed = is_file($path);
        $backup = null;

        if ($existed) {
            $backup = file_get_contents($path);
            unlink($path);
        }

        try {
            $this->get('/app/sw.js')->assertNotFound();
        } finally {
            if ($existed && $backup !== null) {
                file_put_contents($path, $backup);
            }
        }
    }
}
