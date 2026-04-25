<?php

namespace App\Data\PowerSync;

use App\PowerSync\PowerSyncCrudType;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;

final class PowerSyncCrudEntryData extends Data
{
    public const OP_PUT = 'PUT';

    public const OP_PATCH = 'PATCH';

    public const OP_DELETE = 'DELETE';

    /**
     * @param  ?array<string, mixed>  $data
     */
    public function __construct(
        public string $op,
        public PowerSyncCrudType $type,
        public string $id,
        public ?array $data,
    ) {}

    /**
     * @return array<int, string>
     */
    public static function ops(): array
    {
        return [
            self::OP_PUT,
            self::OP_PATCH,
            self::OP_DELETE,
        ];
    }

    /**
     * @return array<string, list<string|\Illuminate\Contracts\Validation\ValidationRule|\Illuminate\Validation\Rules\Enum>>
     */
    public static function prefixedRules(string $prefix): array
    {
        return [
            $prefix.'.op' => ['required', Rule::in(self::ops())],
            $prefix.'.type' => ['required', Rule::enum(PowerSyncCrudType::class)],
            $prefix.'.id' => ['required', 'uuid'],
            $prefix.'.data' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array{op: string, type: string, id: string, data: ?array<string, mixed>}
     */
    public function toApplierPayload(): array
    {
        return [
            'op' => $this->op,
            'type' => $this->type->value,
            'id' => $this->id,
            'data' => $this->data,
        ];
    }
}
