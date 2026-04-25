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
        public ?AddressResponseData $address,
    ) {}

    /**
     * @param  Program  $program  Expects `users` loaded at the call site (e.g. `load('users')` or `fresh([..., 'users'])`).
     *                            In non-production, accessing `users` without loading throws (strict mode / lazy-load prevention).
     */
    public static function fromModel(Program $program): self
    {
        $address = null;

        if ($program->address !== null) {
            $address = AddressResponseData::from([
                'id' => (string) $program->address->getKey(),
                'line_1' => $program->address->line_1,
                'line_2' => $program->address->line_2,
                'city' => $program->address->city,
                'postal_code' => $program->address->postal_code,
                'country' => $program->address->country,
            ]);
        }

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
            address: $address,
        );
    }
}
