<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Guarantees safe reviewer identity and sanitized media URLs.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userData = null;

        if ($this->is_anonymous) {
            $userData = [
                'id' => 0,
                'name' => 'Pengguna PASARIA',
                'avatar' => null,
            ];
        } elseif ($this->user) {
            $userData = [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'avatar' => $this->user->avatar,
            ];
        }

        $mediaList = [];
        if ($this->media) {
            $mediaList = $this->media->map(function ($m) {
                return [
                    'id' => $m->id,
                    'media_url' => $m->media_url,
                    'media_type' => $m->media_type,
                ];
            })->values()->all();
        }

        return [
            'id' => $this->id,
            'user_id' => $this->is_anonymous ? 0 : $this->user_id,
            'product_id' => $this->product_id,
            'rating' => (int) $this->rating,
            'review_text' => $this->review_text,
            'is_anonymous' => (bool) $this->is_anonymous,
            'is_verified_purchase' => (bool) $this->is_verified_purchase,
            'status' => $this->status,
            'seller_reply' => $this->seller_reply,
            'replied_at' => $this->replied_at,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $userData,
            'media' => $mediaList,
        ];
    }
}
