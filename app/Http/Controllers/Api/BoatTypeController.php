<?php

namespace App\Http\Controllers\Api;

use App\Data\BoatTypes\BoatTypeData;
use App\Data\BoatTypes\BoatTypeStoreMediaData;
use App\Http\Controllers\Controller;
use App\Models\BoatType;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BoatTypeController extends Controller
{
    public function storeMedia(BoatTypeStoreMediaData $data, BoatType $boatType): JsonResponse
    {
        $this->authorize('update', $boatType);

        DB::transaction(function () use ($boatType, $data): void {
            foreach ($data->images as $file) {
                $boatType->addMedia($file)->toMediaCollection('images');
            }
        });

        return response()->json([
            'data' => BoatTypeData::fromModel($boatType->fresh()),
        ]);
    }
}
