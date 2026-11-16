<?php

namespace App\Console\Commands;

use App\Support\ObjectStorage\ObjectStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneOrphanUploadsCommand extends Command
{
    protected $signature = 'media:prune-orphan-uploads {--hours=168 : Only delete uploads older than this many hours (offline devices may attach an upload days later)}';

    protected $description = 'Delete uploaded images that no program, product or boat type references.';

    /**
     * Tables whose banner_object_key column references an uploaded object.
     *
     * @var list<string>
     */
    private const REFERENCING_TABLES = ['programs', 'products', 'boat_types'];

    public function handle(ObjectStorage $objectStorage): int
    {
        $disk = $objectStorage->disk();
        $cutoff = now()->subHours(max(1, (int) $this->option('hours')))->getTimestamp();
        $referencedKeys = $this->referencedKeys();
        $deleted = 0;

        foreach ($disk->files('uploads') as $objectKey) {
            if (isset($referencedKeys[$objectKey]) || $disk->lastModified($objectKey) > $cutoff) {
                continue;
            }

            $disk->delete($objectKey);
            $deleted++;
        }

        $this->info('Deleted '.$deleted.' orphan upload(s).');

        return self::SUCCESS;
    }

    /**
     * @return array<string, true>
     */
    private function referencedKeys(): array
    {
        $keys = [];

        foreach (self::REFERENCING_TABLES as $table) {
            foreach (DB::table($table)->whereNotNull('banner_object_key')->pluck('banner_object_key') as $key) {
                $keys[(string) $key] = true;
            }
        }

        return $keys;
    }
}
