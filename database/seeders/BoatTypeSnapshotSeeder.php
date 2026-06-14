<?php

namespace Database\Seeders;

use App\Models\BoatType;
use App\Models\Program;
use Illuminate\Database\Seeder;

class BoatTypeSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $program = Program::query()
            ->where('slug', ProgramSnapshotSeeder::SLUG_AIME_LEONARD)
            ->firstOrFail();

        BoatType::query()->updateOrCreate(
            [
                'program_id' => $program->getKey(),
                'name' => 'Rabaska',
            ],
            [
                'banner_object_key' => 'uploads/01KR9VJA1V07FFCTKF3NJXEN7H.jpg',
                'banner_mime_type' => 'image/jpeg',
                'banner_size_bytes' => 325101,
                'banner_etag' => 'a393f1a570d40a34beec1ef9dff4d475',
                'banner_uploaded_at' => '2026-05-10 21:09:22',
            ],
        );
    }
}
