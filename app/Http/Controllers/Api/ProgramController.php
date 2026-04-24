<?php

namespace App\Http\Controllers\Api;

use App\Data\Programs\ProgramData;
use App\Data\Programs\ProgramStoreData;
use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProgramController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $data = ProgramStoreData::from($request);

        $program = DB::transaction(function () use ($data, $user): Program {
            $id = $data->id ?? (string) Str::uuid();

            $themeColor = strtoupper($data->theme_color);

            /** @var Program $program */
            $program = Program::query()->create([
                'id' => $id,
                'user_id' => $user->getAuthIdentifier(),
                'name' => $data->name,
                'description' => $data->description,
                'theme_color' => $themeColor,
            ]);

            if ($data->address !== null && $data->address->hasAnyNonEmpty()) {
                $program->address()->create($data->address->toRow());
            }

            if ($data->images !== null) {
                foreach ($data->images as $file) {
                    $program->addMedia($file)->toMediaCollection('images');
                }
            }

            return $program->fresh(['address']);
        });

        return response()->json([
            'data' => ProgramData::fromModel($program),
        ], 201);
    }

    public function storeMedia(Request $request, Program $program): JsonResponse
    {
        $this->authorize('update', $program);

        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:12'],
            'images.*' => ['file', 'image', 'max:12288'],
        ]);

        DB::transaction(function () use ($program, $validated): void {
            foreach ($validated['images'] as $file) {
                $program->addMedia($file)->toMediaCollection('images');
            }
        });

        return response()->json([
            'data' => ProgramData::fromModel($program->fresh(['address'])),
        ]);
    }
}
