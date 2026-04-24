<?php

namespace App\Data\Programs;

use Spatie\LaravelData\Data;

final class AddressUpsertData extends Data
{
    public function __construct(
        public ?string $line_1,
        public ?string $line_2,
        public ?string $city,
        public ?string $postal_code,
        public ?string $country,
    ) {}

    public function hasAnyNonEmpty(): bool
    {
        foreach ([$this->line_1, $this->line_2, $this->city, $this->postal_code, $this->country] as $value) {
            if (is_string($value) && trim($value) !== '') {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<string, string|null>
     */
    public function toRow(): array
    {
        return [
            'line_1' => $this->normalize($this->line_1),
            'line_2' => $this->normalize($this->line_2),
            'city' => $this->normalize($this->city),
            'postal_code' => $this->normalize($this->postal_code),
            'country' => $this->normalize($this->country),
        ];
    }

    private function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
