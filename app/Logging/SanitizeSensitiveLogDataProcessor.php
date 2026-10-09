<?php

namespace App\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

/**
 * Processor to redact sensitive credentials, tokens, and payment data
 * before they are persisted into application log files or log streams.
 */
class SanitizeSensitiveLogDataProcessor implements ProcessorInterface
{
    protected static array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'old_password',
        'new_password',
        'token',
        'auth_token',
        'bearer_token',
        'access_token',
        'refresh_token',
        'authorization',
        'api_key',
        'secret',
        'app_key',
        'card_number',
        'cvv',
        'cvc',
        'pin',
    ];

    public function __invoke(LogRecord $record): LogRecord
    {
        $context = $this->sanitize($record->context);
        $extra = $this->sanitize($record->extra);

        return $record->with(context: $context, extra: $extra);
    }

    public function sanitize(mixed $data): mixed
    {
        if (!is_array($data)) {
            return $data;
        }

        foreach ($data as $key => $value) {
            $normalizedKey = strtolower((string) $key);
            if (in_array($normalizedKey, static::$sensitiveKeys, true)) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->sanitize($value);
            }
        }

        return $data;
    }
}
