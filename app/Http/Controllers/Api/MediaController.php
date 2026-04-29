<?php

namespace App\Http\Controllers\Api;

use App\Actions\Media\ResolveMediaAttachableAction;
use App\Data\Media\MediaItemData;
use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Support\MediaProgramContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MediaController extends Controller
{
    public function __construct(
        private readonly ResolveMediaAttachableAction $resolveMediaAttachable,
    ) {}

    public function index(string $type, string $id): JsonResponse
    {
        $resolved = $this->resolveMediaAttachable->run($type, $id);

        $this->authorize('update', $resolved->program);

        $items = $resolved->attachable->getMedia('images');

        /** @var list<MediaItemData> $data */
        $data = $items->map(
            static fn (Media $media) => MediaItemData::fromMedia($media)
        )->values()->all();

        return response()->json([
            'data' => $data,
        ]);
    }

    public function store(Request $request, string $type, string $id): JsonResponse
    {
        $resolved = $this->resolveMediaAttachable->run($type, $id);

        $this->authorize('update', $resolved->program);

        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:12'],
            'images.*' => ['file', 'image', 'max:12288'],
        ]);

        /** @var list<Media> $uploaded */
        $uploaded = [];

        MediaProgramContext::run($resolved->programId, function () use ($resolved, $validated, &$uploaded): void {
            DB::transaction(function () use ($resolved, $validated, &$uploaded): void {
                foreach ($validated['images'] as $file) {
                    $uploaded[] = $resolved->attachable->addMedia($file)->toMediaCollection('images');
                }
            });
        });

        $data = array_map(
            static fn (Media $media) => MediaItemData::fromMedia($media),
            $uploaded
        );

        return response()->json([
            'data' => $data,
        ]);
    }
}
