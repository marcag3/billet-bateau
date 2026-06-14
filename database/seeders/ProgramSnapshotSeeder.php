<?php

namespace Database\Seeders;

use App\Enums\ProgramRole;
use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProgramSnapshotSeeder extends Seeder
{
    public const string SLUG_SAINT_LAURENT = 'ete-2026-saint-laurent';

    public const string SLUG_AIME_LEONARD = 'ete-2026-aime-leonard';

    public function run(): void
    {
        Program::query()->updateOrCreate(
            ['slug' => self::SLUG_SAINT_LAURENT],
            [
                'name' => 'Été 2026 saint-Laurent',
                'description' => 'Odio omnis consequuntur facere tempore nostrum illo. Voluptate et possimus error possimus fugiat accusamus.',
                'theme_color' => '#5CE1CD',
                'is_active' => true,
                'start_date' => '2026-06-01',
                'end_date' => '2026-09-30',
                'line_1' => null,
                'line_2' => null,
                'city' => null,
                'postal_code' => null,
                'country' => null,
                'banner_object_key' => 'uploads/01KRAKA41W1S2TG096N29P0YZZ.jpg',
                'banner_mime_type' => 'image/jpeg',
                'banner_size_bytes' => 325101,
                'banner_etag' => 'a393f1a570d40a34beec1ef9dff4d475',
                'banner_uploaded_at' => '2026-05-11 04:04:19',
            ],
        );

        Program::query()->updateOrCreate(
            ['slug' => self::SLUG_AIME_LEONARD],
            [
                'name' => 'Été 2026 Aimé-Léonard',
                'description' => 'Voluptatem illo qui rem voluptates in qui magnam. Quasi occaecati sit ut nihil reiciendis doloribus voluptatem.',
                'theme_color' => '#E1B9A8',
                'is_active' => true,
                'start_date' => '2026-06-01',
                'end_date' => '2026-09-30',
                'line_1' => null,
                'line_2' => null,
                'city' => null,
                'postal_code' => null,
                'country' => null,
                'banner_object_key' => 'uploads/01KRWSMB1KCBBKMGK04R0NDWFB.webp',
                'banner_mime_type' => 'image/png',
                'banner_size_bytes' => 12988,
                'banner_etag' => '48b7bdb004b320901826699f0d030161',
                'banner_uploaded_at' => '2026-05-10 22:24:00',
            ],
        );

        $user = User::query()
            ->where('email', 'test@example.com')
            ->firstOrFail();

        Program::query()
            ->whereIn('slug', [self::SLUG_SAINT_LAURENT, self::SLUG_AIME_LEONARD])
            ->each(function (Program $program) use ($user): void {
                $program->users()->syncWithoutDetaching([
                    $user->getKey() => ['role' => ProgramRole::Owner->value],
                ]);
            });
    }
}
