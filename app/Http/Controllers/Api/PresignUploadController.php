<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Support\Media\ImageUpload;
use App\Support\ObjectStorage\ObjectStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PresignUploadController extends Controller
{
    public function __construct(
        private readonly ObjectStorage $objectStorage,
    ) {}

    public function presignUpload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mime_type' => ['required', 'string', Rule::in(ImageUpload::ALLOWED_MIME_TYPES)],
        ]);

        $objectKey = ImageUpload::objectKeyForMime($validated['mime_type']);

        $signed = $this->objectStorage->temporaryPutUrl($objectKey, [
            'ContentType' => $validated['mime_type'],
            'CacheControl' => ImageUpload::IMMUTABLE_CACHE_CONTROL,
        ]);

        return response()->json([
            'data' => [
                'url' => $signed['url'],
                'headers' => $signed['headers'],
                'object_key' => $objectKey,
                'object_url' => Program::mediaUrlFromKey($objectKey),
            ],
        ]);
    }
}
