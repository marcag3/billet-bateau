<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\Media\MediaConfig;
use Illuminate\Http\JsonResponse;

final class AppServiceWorkerConfigController
{
    public function __invoke(): JsonResponse
    {
        return response()->json(MediaConfig::serviceWorkerPayload());
    }
}
