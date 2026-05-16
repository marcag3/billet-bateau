<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class PowerSyncUploadProductBannerTest extends TestCase
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

    public function test_put_persists_product_banner_fields(): void
    {
        $user = User::factory()->create();
        $program = Program::factory()->withOwner($user)->create();
        $productId = (string) Str::ulid();
        $key = 'uploads/'.Str::ulid().'.png';
        Storage::disk('s3')->put($key, 'x');

        $this->actingAs($user)->postJson('/api/powersync/upload', [
            'crud' => [
                [
                    'op' => 'PUT',
                    'type' => 'products',
                    'id' => $productId,
                    'data' => [
                        'program_id' => $program->getKey(),
                        'name' => 'Sunset cruise',
                        'capacity' => 8,
                        'boat_type_id' => null,
                        'water_route_id' => null,
                        'banner_object_key' => $key,
                        'banner_mime_type' => 'image/png',
                        'banner_size_bytes' => 1,
                        'banner_etag' => null,
                        'banner_uploaded_at' => '2026-01-02T12:00:00.000Z',
                    ],
                ],
            ],
        ])->assertOk();

        $product = Product::query()->whereKey($productId)->first();
        $this->assertNotNull($product);
        $this->assertSame($key, $product->banner_object_key);
        $this->assertSame('image/png', $product->banner_mime_type);
        $this->assertSame(1, (int) $product->banner_size_bytes);
    }
}
