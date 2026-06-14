<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class AppServiceWorkerScriptController
{
    public function __invoke(): BinaryFileResponse
    {
        $path = public_path('build/app-sw.js');

        abort_unless(is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => 'application/javascript; charset=UTF-8',
            'Cache-Control' => 'public, max-age=0, must-revalidate',
        ]);
    }
}
