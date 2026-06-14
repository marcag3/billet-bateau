<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncProgramBannerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('s3');
        config([
            'filesystems.disks.s3.url' => 'http://localhost:9000/app',
            'filesystems.disks.s3.endpoint' => 'http://object-storage.test',
            'filesystems.s3_presign_endpoint' => 'http://object-storage.test',
            'media.public_base_url' => 'http://localhost:9000/app',
        ]);
    }

    public function test_patch_persists_banner_fields_and_recomputes_public_url(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create(['name' => 'Patched']);

        $key = 'uploads/'.Str::ulid().'.png';
        Storage::disk('s3')->put($key, 'x');

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'banner_object_key' => $key,
                        'banner_mime_type' => 'image/png',
                        'banner_size_bytes' => 1,
                        'banner_etag' => null,
                        'banner_uploaded_at' => '2026-01-02T12:00:00.000Z',
                    ],
                ],
            ],
        ])->assertOk();

        $program->refresh();
        $this->assertSame($key, $program->banner_object_key);
        $this->assertSame('http://localhost:9000/app/'.$key, $program->getImageUrl('banner'));
        $this->assertSame('image/png', $program->banner_mime_type);
        $this->assertSame(1, (int) $program->banner_size_bytes);
    }

    public function test_patch_normalizes_quoted_banner_etag(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create(['name' => 'Etag']);

        $key = 'uploads/'.Str::ulid().'.png';
        Storage::disk('s3')->put($key, 'x');

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'banner_object_key' => $key,
                        'banner_mime_type' => 'image/png',
                        'banner_size_bytes' => 1,
                        'banner_etag' => '"abc123def"',
                        'banner_uploaded_at' => '2026-01-02T12:00:00.000Z',
                    ],
                ],
            ],
        ])->assertOk();

        $program->refresh();
        $this->assertSame('abc123def', $program->banner_etag);
    }

    public function test_patch_replaces_banner_and_deletes_prior_upload_object(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create(['name' => 'Swap']);

        $firstKey = 'uploads/'.Str::ulid().'.png';
        $secondKey = 'uploads/'.Str::ulid().'.png';
        Storage::disk('s3')->put($firstKey, 'a');
        Storage::disk('s3')->put($secondKey, 'bbbbbbbbbb');

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'banner_object_key' => $firstKey,
                        'banner_mime_type' => 'image/png',
                        'banner_size_bytes' => 1,
                        'banner_uploaded_at' => '2026-01-02T12:00:00.000Z',
                    ],
                ],
            ],
        ])->assertOk();

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PATCH',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                    'data' => [
                        'banner_object_key' => $secondKey,
                        'banner_mime_type' => 'image/png',
                        'banner_size_bytes' => 10,
                        'banner_uploaded_at' => '2026-01-03T12:00:00.000Z',
                    ],
                ],
            ],
        ])->assertOk();

        $this->assertFalse(Storage::disk('s3')->exists($firstKey));
        $this->assertTrue(Storage::disk('s3')->exists($secondKey));
    }

    public function test_delete_program_attempts_banner_object_delete_without_failing(): void
    {
        $user = User::factory()->create();
        $key = 'uploads/'.Str::ulid().'.webp';
        Storage::disk('s3')->put($key, 'w');
        $program = Program::factory()->withOwner($user)->create([
            'banner_object_key' => $key,
        ]);

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'DELETE',
                    'type' => 'programs',
                    'id' => $program->getKey(),
                ],
            ],
        ])->assertOk();

        $this->assertNull(Program::query()->whereKey($program->getKey())->first());
        $this->assertFalse(Storage::disk('s3')->exists($key));
    }
}
