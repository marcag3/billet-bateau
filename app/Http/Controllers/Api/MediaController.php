<?php

namespace App\Http\Controllers\Api;

use App\Data\Media\MediaItemData;
use App\Http\Controllers\Controller;
use App\Models\BoatType;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    public function index(string $type, string $id): JsonResponse
    {
        $model = $this->resolveHasMedia($type, $id);

        $this->authorize('update', $model);

        $items = $model->getMedia('images');

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
        $model = $this->resolveHasMedia($type, $id);

        $this->authorize('update', $model);

        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:12'],
            'images.*' => ['file', 'image', 'max:12288'],
        ]);

        /** @var list<Media> $uploaded */
        $uploaded = [];

        DB::transaction(function () use ($model, $validated, &$uploaded): void {
            foreach ($validated['images'] as $file) {
                $uploaded[] = $model->addMedia($file)->toMediaCollection('images');
            }
        });

        $data = array_map(
            static fn (Media $media) => MediaItemData::fromMedia($media),
            $uploaded
        );

        return response()->json([
            'data' => $data,
        ]);
    }

    private function resolveHasMedia(string $type, string $id): HasMedia
    {
        return match ($type) {
            'program' => Program::query()->findOrFail($id),
            'boat_type' => BoatType::query()->findOrFail($id),
            default => abort(404),
        };
    }
}
