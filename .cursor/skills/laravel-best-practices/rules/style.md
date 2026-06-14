# Conventions & Style

## Follow Laravel Naming Conventions
Use Laravel defaults consistently: singular model/controller names, plural snake_case table names, `{model}_id` foreign keys, camelCase methods/variables, and dotted route names.

## Use Laravel String & Array Helpers

Laravel provides `Str`, `Arr`, `Number`, and `Uri` helpers that are usually more readable, chainable, and UTF-8 safe than raw PHP functions.

Strings — use `Str` and fluent `Str::of()` over raw PHP:
```php
// Incorrect
$slug = strtolower(str_replace(' ', '-', $title));
$short = substr($text, 0, 100) . '...';
$class = substr(strrchr('App\Models\User', '\'), 1);

// Correct
$slug = Str::slug($title);
$short = Str::limit($text, 100);
$class = class_basename('App\Models\User');
```

Fluent strings — chain operations for complex transformations:
```php
// Incorrect
$result = strtolower(trim(str_replace('_', '-', $input)));

// Correct
$result = Str::of($input)->trim()->replace('_', '-')->lower();
```

Arrays — use `Arr` over raw PHP:
```php
// Incorrect
$name = isset($array['user']['name']) ? $array['user']['name'] : 'default';

// Correct
$name = Arr::get($array, 'user.name', 'default');
```

Use `$request->string('name')` to get a fluent `Stringable` directly from request input for immediate chaining.

Use framework helpers first, then check docs when you need a specific method.

## No Inline JS/CSS in Blade

Do not put JS or CSS in Blade templates. Do not put HTML in PHP classes.

Incorrect:
```blade
let article = `{{ json_encode($article) }}`;
```

Correct:
```blade
<button class="js-fav-article" data-article='@json($article)'>{{ $article->name }}</button>
```

Pass data to JS via data attributes or use a dedicated PHP-to-JS package.

## No Unnecessary Comments

Code should be readable on its own. Use descriptive method and variable names instead of comments. The only exception is config files, where descriptive comments are expected.

Incorrect:
```php
// Check if there are any joins
if (count((array) $builder->getQuery()->joins) > 0)
```

Correct:
```php
if ($this->hasJoins())
```