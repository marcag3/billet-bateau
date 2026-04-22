<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ShapeProxyControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_todo_shape_proxy(): void
    {
        $response = $this->getJson('/api/shapes/todos');

        $response->assertUnauthorized();
    }

    public function test_proxy_uses_authenticated_user_shape_and_forwards_only_continuity_params(): void
    {
        $user = User::factory()->create();

        config()->set('electric.service_url', 'http://electric:3000');
        config()->set('electric.source_id', 'default');
        config()->set('electric.api_secret', 'test-api-secret');

        Http::fake(function (HttpRequest $request) use ($user) {
            $parts = parse_url($request->url());
            parse_str($parts['query'] ?? '', $query);

            $this->assertSame('/v1/shape', $parts['path'] ?? null);
            $this->assertSame('todos', $query['table'] ?? null);
            $this->assertSame('user_id = '.(string) $user->getAuthIdentifier(), $query['where'] ?? null);
            $this->assertSame('default', $query['source_id'] ?? null);
            $this->assertSame('test-api-secret', $query['api_secret'] ?? null);
            $this->assertArrayNotHasKey('secret', $query);

            $this->assertSame('true', $query['live'] ?? null);
            $this->assertSame('-1', $query['offset'] ?? null);
            $this->assertSame('abc', $query['handle'] ?? null);

            $this->assertArrayNotHasKey('table_override', $query);
            $this->assertArrayNotHasKey('foo', $query);

            return Http::response('{"ok":true}', 200, [
                'Content-Type' => 'application/json',
                'Vary' => 'Accept-Encoding',
            ]);
        });

        $response = $this
            ->actingAs($user)
            ->getJson('/api/shapes/todos?live=true&offset=-1&handle=abc&foo=bar&table_override=users');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/json');
        $this->assertStringContainsString('Cookie', (string) $response->headers->get('Vary'));
    }
}
