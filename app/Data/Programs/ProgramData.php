<?php

namespace App\Data\Programs;

use App\Models\Program;
use Spatie\LaravelData\Data;

final class ProgramData extends Data
{
    /**
     * @param  list<int>  $user_ids
     */
    public function __construct(
        public string $id,
        public ?int $user_id,
        public array $user_ids,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public bool $is_active,
        public bool $is_archived,
        public string $slug,
        public ?string $line_1,
        public ?string $line_2,
        public ?string $city,
        public ?string $postal_code,
        public ?string $country,
    ) {}

    /**
     * @param  Program  $program  Expects `users` loaded at the call site (e.g. `load('users')` or `fresh([..., 'users'])`).
     *                            In non-production, accessing `users` without loading throws (strict mode / lazy-load prevention).
     */
    public static function fromModel(Program $program): self
    {
        $userIds = $program->users
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->sort()
            ->values()
            ->all();

        return new self(
            id: (string) $program->getKey(),
            user_id: $program->user_id !== null ? (int) $program->user_id : null,
            user_ids: $userIds,
            name: (string) $program->name,
            description: $program->description,
            theme_color: (string) $program->theme_color,
            is_active: (bool) $program->is_active,
            is_archived: (bool) $program->is_archived,
            slug: $program->slug,
            line_1: $program->line_1,
            line_2: $program->line_2,
            city: $program->city,
            postal_code: $program->postal_code,
            country: $program->country,
        );
    }
}
