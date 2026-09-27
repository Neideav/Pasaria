<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * DemoRecordsSeeder
 *
 * Seeds the demo_records table with fictional dummy data.
 * This data is used for UNION-based SQL Injection extraction demonstrations
 * in a controlled, local educational environment.
 *
 * All records are clearly fictitious — no real credentials, API keys,
 * environment variables, or sensitive information is stored here.
 */
class DemoRecordsSeeder extends Seeder
{
    public function run(): void
    {
        $records = [
            ['record_name' => 'Server Room A',      'record_value' => 'Jakarta Branch Office'],
            ['record_name' => 'Warehouse 02',        'record_value' => 'Bekasi Distribution Hub'],
            ['record_name' => 'Inventory System',    'record_value' => 'ERP v3.1 - Operational'],
            ['record_name' => 'Demo Record 01',      'record_value' => 'Asset ID: BR-001'],
            ['record_name' => 'Demo Record 02',      'record_value' => 'Asset ID: BR-002'],
            ['record_name' => 'Demo Record 03',      'record_value' => 'Asset ID: BR-003'],
            ['record_name' => 'Office Network',      'record_value' => 'VLAN 10 - Internal'],
            ['record_name' => 'Branch: Surabaya',    'record_value' => 'Floor 3, Tower B'],
            ['record_name' => 'Branch: Bandung',     'record_value' => 'Floor 7, Menara Hijau'],
            ['record_name' => 'Maintenance Window',  'record_value' => 'Sunday 00:00 - 04:00 WIB'],
        ];

        foreach ($records as $record) {
            DB::table('demo_records')->updateOrInsert(
                ['record_name' => $record['record_name']],
                array_merge($record, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
