<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'sender_type',
        'message',
        'attachment_url',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'conversation_id' => 'integer',
        'sender_id' => 'integer',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
