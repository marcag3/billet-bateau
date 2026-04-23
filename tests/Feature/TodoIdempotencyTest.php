<?php

namespace Tests\Feature;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

class TodoIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_with_same_idempotency_key_returns_cached_body_and_single_row(): void
    {
        Cache::flush();
        $user = User::factory()->create();
        $id = (string) Str::uuid();
        $payload = [
            'id' => $id,
            'title' => 'Buy milk',
            'completed' => false,
        ];
        $headers = ['Idempotency-Key' => 'offline-replay-1'];

        $first = $this->actingAs($user)->postJson('/api/todos', $payload, $headers);
        $first->assertCreated();
        $first->assertJsonPath('data.id', $id);

        $second = $this->actingAs($user)->postJson('/api/todos', $payload, $headers);
        $second->assertCreated();
        $second->assertJsonPath('data.id', $id);
        $second->assertJsonPath('data.title', 'Buy milk');

        $this->assertSame(1, Todo::query()->where('id', $id)->count());
    }
}
