<?php

namespace Tests\Unit;

use App\Support\PowerSync\PowerSyncDiagnosticsIssueCollector;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PowerSyncDiagnosticsIssueCollectorTest extends TestCase
{
    #[Test]
    public function test_collect_returns_empty_when_no_errors_present(): void
    {
        $issues = PowerSyncDiagnosticsIssueCollector::collect([
            'connections' => [
                ['id' => 'default', 'connected' => true, 'errors' => []],
            ],
            'active_sync_rules' => [
                'errors' => [],
                'connections' => [
                    [
                        'id' => 'default',
                        'errors' => [],
                        'tables' => [
                            [
                                'schema' => 'public',
                                'name' => 'programs',
                                'errors' => [],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $this->assertSame([], $issues);
    }

    #[Test]
    public function test_collect_gathers_errors_from_connections_sync_rules_and_tables(): void
    {
        $issues = PowerSyncDiagnosticsIssueCollector::collect([
            'connections' => [
                [
                    'id' => 'default',
                    'errors' => ['database unreachable'],
                ],
            ],
            'active_sync_rules' => [
                'errors' => [
                    ['code' => 'PSYNC_S1146', 'message' => 'Replication slot invalidated'],
                ],
                'connections' => [
                    [
                        'id' => 'default',
                        'errors' => ['replication lag warning'],
                        'tables' => [
                            [
                                'schema' => 'public',
                                'name' => 'trips',
                                'errors' => ['table replication error'],
                            ],
                        ],
                    ],
                ],
            ],
            'deploying_sync_rules' => [
                'errors' => ['deploy in progress warning'],
            ],
        ]);

        $this->assertSame([
            ['scope' => 'connection:default', 'message' => 'database unreachable'],
            ['scope' => 'active_sync_rules', 'message' => 'PSYNC_S1146: Replication slot invalidated'],
            ['scope' => 'active_sync_rules.connection:default', 'message' => 'replication lag warning'],
            ['scope' => 'active_sync_rules.table:public.trips', 'message' => 'table replication error'],
            ['scope' => 'deploying_sync_rules', 'message' => 'deploy in progress warning'],
        ], $issues);
    }
}
