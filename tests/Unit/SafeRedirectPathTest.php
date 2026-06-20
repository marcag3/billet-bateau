<?php

namespace Tests\Unit;

use App\Support\Auth\SafeRedirectPath;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SafeRedirectPathTest extends TestCase
{
    #[DataProvider('sanitizeExamples')]
    public function test_sanitize(?string $input, string $expected): void
    {
        $this->assertSame($expected, SafeRedirectPath::sanitize($input));
    }

    /**
     * @return array<string, array{0: ?string, 1: string}>
     */
    public static function sanitizeExamples(): array
    {
        return [
            'null defaults to app' => [null, '/app'],
            'empty defaults to app' => ['', '/app'],
            'relative path allowed' => ['/app/programs', '/app/programs'],
            'external url rejected' => ['https://evil.example/phish', '/app'],
            'protocol relative rejected' => ['//evil.example/phish', '/app'],
            'backslash rejected' => ['/app\\evil', '/app'],
        ];
    }
}
