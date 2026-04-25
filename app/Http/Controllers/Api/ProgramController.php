<?php

namespace App\Http\Controllers\Api;

use App\Data\Programs\ProgramData;
use App\Data\Programs\ProgramStoreData;
use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Program;
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

            $addressId = null;
            if ($data->address !== null && $data->address->hasAnyNonEmpty()) {
                $address = Address::query()->create($data->address->toRow());
                $addressId = $address->id;
            }

            /** @var Program $program */
            $program = Program::query()->create([
                'id' => $id,
                'user_id' => $user->getAuthIdentifier(),
                'address_id' => $addressId,
                'name' => $data->name,
                'description' => $data->description,
                'theme_color' => $themeColor,
                'is_active' => false,
                'slug' => $data->slug,
            ]);

            if ($data->images !== null) {
                foreach ($data->images as $file) {
                    $program->addMedia($file)->toMediaCollection('images');
                }
            }

            // First manager on the program; additional managers require an invite (pivot row).
            $program->users()->syncWithoutDetaching([(int) $user->getAuthIdentifier()]);

            return $program->fresh(['address', 'users']);
        });

        return response()->json([
            'data' => ProgramData::fromModel($program),
        ], 201);
    }
}
