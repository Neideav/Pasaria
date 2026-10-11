<?php

namespace App\Services;

class TotpService
{
    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Generate a cryptographically secure Base32 secret string.
     */
    public function generateSecret(int $length = 16): string
    {
        $secret = '';
        $alphabetLength = strlen(self::BASE32_ALPHABET);

        for ($i = 0; $i < $length; $i++) {
            $secret .= self::BASE32_ALPHABET[random_int(0, $alphabetLength - 1)];
        }

        return $secret;
    }

    /**
     * Generate standard otpauth URI compatible with Google Authenticator, Authy, Microsoft Authenticator.
     */
    public function getQrCodeUri(string $emailOrUsername, string $secret, string $issuer = 'PASARIA'): string
    {
        $account = rawurlencode($emailOrUsername);
        $issuerEncoded = rawurlencode($issuer);

        return "otpauth://totp/{$issuerEncoded}:{$account}?secret={$secret}&issuer={$issuerEncoded}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Generate 8 single-use recovery backup codes formatted as XXXX-XXXX.
     */
    public function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $hex = bin2hex(random_bytes(4));
            $codes[] = strtoupper(substr($hex, 0, 4) . '-' . substr($hex, 4, 4));
        }

        return $codes;
    }

    /**
     * Verify a 6-digit TOTP code against the Base32 secret with drift window tolerance.
     */
    public function verify(string $secret, string $code, int $discrepancy = 1): bool
    {
        $code = trim($code);
        if (strlen($code) !== 6 || !ctype_digit($code)) {
            return false;
        }

        $currentTimeSlice = (int) floor(time() / 30);

        for ($offset = -$discrepancy; $offset <= $discrepancy; $offset++) {
            $slice = $currentTimeSlice + $offset;
            if ($this->calculateCode($secret, $slice) === $code) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate 6-digit TOTP code for a specific time slice per RFC 6238 / RFC 4226.
     */
    public function calculateCode(string $secret, int $timeSlice): string
    {
        $secretKey = $this->base32Decode($secret);
        if (empty($secretKey)) {
            return '';
        }

        // Pack time counter as 8-byte big-endian binary
        $binaryTime = pack('N*', 0) . pack('N*', $timeSlice);

        // Compute HMAC-SHA1
        $hash = hash_hmac('sha1', $binaryTime, $secretKey, true);

        // Dynamic truncation
        $offset = ord(substr($hash, -1)) & 0x0F;
        $hashSlice = substr($hash, $offset, 4);
        $unpacked = unpack('N', $hashSlice);
        $value = ($unpacked[1] & 0x7FFFFFFF) % 1000000;

        return str_pad((string) $value, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Base32 decode binary helper.
     */
    private function base32Decode(string $b32): string
    {
        $b32 = strtoupper(trim($b32));
        $b32 = rtrim($b32, '=');

        if (empty($b32)) {
            return '';
        }

        $buffer = 0;
        $bitsLeft = 0;
        $output = '';

        for ($i = 0; $i < strlen($b32); $i++) {
            $char = $b32[$i];
            $val = strpos(self::BASE32_ALPHABET, $char);
            if ($val === false) {
                continue;
            }

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $output .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $output;
    }
}
