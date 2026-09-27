<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * DemoRecord Model
 *
 * Represents rows in the demo_records table.
 * This table is used exclusively for SQL Injection UNION-based data extraction
 * demonstrations in the local educational environment.
 * All data is fictional dummy records.
 */
class DemoRecord extends Model
{
    protected $fillable = [
        'record_name',
        'record_value',
    ];
}
