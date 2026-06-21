<?php

namespace Tests\Support;

use Illuminate\Testing\TestResponse;

trait AssertsPowerSyncUploadRejected
{
    protected function assertPowerSyncUploadRejected(
        TestResponse $response,
        int $index = 0,
    ): TestResponse {
        $response->assertOk()
            ->assertJsonPath("results.{$index}.status", 'rejected');

        return $response;
    }
}
