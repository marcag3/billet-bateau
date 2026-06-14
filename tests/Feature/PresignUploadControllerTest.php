<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PresignUploadControllerTest extends TestCase
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

    public function test_presign_upload_requires_authentication(): void
    {
        $this->postJson('/api/presign-upload', [
            'mime_type' => 'image/png',
        ])->assertUnauthorized();
    }

    public function test_presign_upload_returns_expected_contract(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/presign-upload', [
            'mime_type' => 'image/png',
        ]);

        $response->assertOk();
        $objectKey = $response->json('data.object_key');
        $this->assertIsString($objectKey);
        $this->assertStringStartsWith('uploads/', $objectKey);
        $this->assertStringEndsWith('.png', $objectKey);
        $response->assertJsonPath('data.object_url', 'http://localhost:9000/app/'.$objectKey);
        $this->assertIsString($response->json('data.url'));
        $this->assertNotSame('', $response->json('data.url'));
        $response->assertJsonMissingPath('data.headers.x-amz-acl');
        $response->assertJsonMissingPath('data.headers.X-Amz-Acl');
    }
}
