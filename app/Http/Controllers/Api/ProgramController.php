<?php

namespace App\Http\Controllers\Api;

use App\Data\Programs\ProgramData;
use App\Data\Programs\ProgramStoreData;
use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Support\MediaProgramContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProgramController extends Controller
{
    public function store(ProgramStoreData $data): JsonResponse
    {
        $program = DB::transaction(function () use ($data): Program {
            $id = $data->id ?? (string) Str::ulid();

            $themeColor = strtoupper($data->theme_color);

            $addressRow = $data->address !== null && $data->address->hasAnyNonEmpty()
                ? $data->address->toRow()
                : [
                    'line_1' => null,
                    'line_2' => null,
                    'city' => null,
                    'postal_code' => null,
                    'country' => null,
                ];

            /** @var Program $program */
            $program = Program::query()->create(array_merge(
                [
                    'id' => $id,
                    'user_id' => Auth::id(),
                    'name' => $data->name,
                    'description' => $data->description,
                    'theme_color' => $themeColor,
                    'is_active' => $data->is_active,
                    'is_archived' => (bool) ($data->is_archived ?? false),
                    'slug' => $data->slug,
                ],
                $addressRow,
            ));

            if ($data->images !== null) {
                MediaProgramContext::run($id, function () use ($data, $program): void {
                    foreach ($data->images as $file) {
                        $program->addMedia($file)->toMediaCollection('images');
                    }
                });
            }

            // First manager on the program; additional managers require an invite (pivot row).
            $program->users()->syncWithoutDetaching([Auth::id()]);

            return $program->fresh(['users']);
        });

        return response()->json([
            'data' => ProgramData::fromModel($program),
        ], 201);
    }
}
