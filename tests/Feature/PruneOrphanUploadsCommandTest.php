<?php

namespace Tests\Feature;

use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PruneOrphanUploadsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_deletes_only_old_unreferenced_uploads(): void
    {
        $disk = Storage::fake('s3');
        $referencedKey = 'uploads/01JREFERENCED00000000000000.png';
        $orphanKey = 'uploads/01JORPHAN000000000000000000.png';
        $recentKey = 'uploads/01JRECENT000000000000000000.png';

        foreach ([$referencedKey, $orphanKey, $recentKey] as $key) {
            $disk->put($key, 'image');
        }
        touch($disk->path($referencedKey), now()->subDays(8)->getTimestamp());
        touch($disk->path($orphanKey), now()->subDays(8)->getTimestamp());

        Program::factory()->create(['banner_object_key' => $referencedKey]);

        $this->artisan('media:prune-orphan-uploads')
            ->expectsOutput('Deleted 1 orphan upload(s).')
            ->assertSuccessful();

        $disk->assertExists($referencedKey);
        $disk->assertExists($recentKey);
        $disk->assertMissing($orphanKey);
    }
}
