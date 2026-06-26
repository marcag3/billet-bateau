<?php

namespace App\Support\PowerSync;

final class PowerSyncDiagnosticsIssueCollector
{
    /**
     * @param  array<string, mixed>  $diagnosticsData
     * @return list<array{scope: string, message: string}>
     */
    public static function collect(array $diagnosticsData): array
    {
        $issues = [];

        foreach ($diagnosticsData['connections'] ?? [] as $connection) {
            if (! is_array($connection)) {
                continue;
            }

            $connectionId = is_string($connection['id'] ?? null)
                ? $connection['id']
                : 'unknown';

            self::appendErrors(
                $issues,
                $connection['errors'] ?? [],
                "connection:{$connectionId}",
            );
        }

        foreach (['active_sync_rules', 'deploying_sync_rules'] as $rulesKey) {
            $rules = $diagnosticsData[$rulesKey] ?? null;
            if (! is_array($rules)) {
                continue;
            }

            self::appendErrors($issues, $rules['errors'] ?? [], $rulesKey);

            foreach ($rules['connections'] ?? [] as $connection) {
                if (! is_array($connection)) {
                    continue;
                }

                $connectionId = is_string($connection['id'] ?? null)
                    ? $connection['id']
                    : 'unknown';

                self::appendErrors(
                    $issues,
                    $connection['errors'] ?? [],
                    "{$rulesKey}.connection:{$connectionId}",
                );

                foreach ($connection['tables'] ?? [] as $table) {
                    if (! is_array($table)) {
                        continue;
                    }

                    $schema = is_string($table['schema'] ?? null)
                        ? $table['schema']
                        : 'unknown';
                    $name = is_string($table['name'] ?? null)
                        ? $table['name']
                        : 'unknown';

                    self::appendErrors(
                        $issues,
                        $table['errors'] ?? [],
                        "{$rulesKey}.table:{$schema}.{$name}",
                    );
                }
            }
        }

        return $issues;
    }

    /**
     * @param  list<array{scope: string, message: string}>  $issues
     */
    private static function appendErrors(array &$issues, mixed $errors, string $scope): void
    {
        if (! is_array($errors)) {
            return;
        }

        foreach ($errors as $error) {
            $message = self::normalizeError($error);
            if ($message === '') {
                continue;
            }

            $issues[] = [
                'scope' => $scope,
                'message' => $message,
            ];
        }
    }

    private static function normalizeError(mixed $error): string
    {
        if ($error === null || $error === '') {
            return '';
        }

        if (is_string($error)) {
            return $error;
        }

        if (is_array($error)) {
            $message = $error['message'] ?? $error['error'] ?? null;
            $code = $error['code'] ?? null;

            if (is_string($message) && is_string($code) && $code !== '') {
                return "{$code}: {$message}";
            }

            if (is_string($message) && $message !== '') {
                return $message;
            }

            $encoded = json_encode($error);

            return is_string($encoded) ? $encoded : '';
        }

        if (is_scalar($error)) {
            return (string) $error;
        }

        return '';
    }
}
