# Validation & Data DTO Best Practices

## Use Laravel Data DTOs for Validation

Use [spatie/laravel-data](https://github.com/spatie/laravel-data) DTOs with the TypeScript transformer instead of Form Requests for API input validation and response typing.

Each model should define:

- `ModelData`: full attributes used to hydrate the frontend database.
- `ModelUpsertData`: input DTO for `store` and `update`, including validation rules.

## Preferred Laravel Data Validation Strategy

When validating `spatie/laravel-data` DTOs, always prefer the following order:

1. Auto rule inferring
2. Validation attributes
3. Manual `rules()` only with `#[MergeValidationRules]` (required)

### 1) Auto Rule Inferring (default)

Default to inferred rules from property types and nullability. Keep DTO properties strongly typed so inferred rules stay accurate.

```php
class PostUpsertData extends Data
{
    public function __construct(
        public string $title,
        public ?string $excerpt,
        public int $category_id,
    ) {}
}
```

### 2) Validation Attributes (preferred extension point)

Add validation attributes when inferred rules are not sufficient.

```php
class PostUpsertData extends Data
{
    public function __construct(
        #[Max(255)]
        public string $title,
        #[In(['draft', 'published'])]
        public string $status,
    ) {}
}
```

### 3) Manual Rules (only when necessary)

Use manual `rules()` as a last resort. If manual rules are added, `#[MergeValidationRules]` is required so inferred and attribute-based rules are preserved.

```php
#[MergeValidationRules]
class PostUpsertData extends Data
{
    public function __construct(
        public string $title,
        public int $author_id,
    ) {}

    public static function rules(): array
    {
        return [
            'author_id' => ['exists:users,id'],
        ];
    }
}
```

Never introduce manual `rules()` without `#[MergeValidationRules]`.

Incorrect:

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => ['required', 'max:255'],
        'body' => ['required'],
    ]);

    return Post::create($validated);
}
```

Correct:

```php
public function store(PostUpsertData $data): PostData
{
    $post = Post::query()->create($data->all());

    return PostData::from($post);
}
```

## Use `Rule::when()` for Conditional Validation

```php
'company_name' => [
    Rule::when($this->account_type === 'business', ['required', 'string', 'max:255']),
],
```

