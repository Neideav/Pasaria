<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicQuestionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Sanitizes inquirer and shop answer metadata for public Q&A.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userData = null;
        if ($this->user) {
            $userData = [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'avatar' => $this->user->avatar,
            ];
        }

        $answersList = [];
        if ($this->answers) {
            $answersList = $this->answers->map(function ($a) {
                $shopData = null;
                if ($a->shop) {
                    $shopData = [
                        'id' => $a->shop->id,
                        'name' => $a->shop->name,
                        'slug' => $a->shop->slug,
                        'logo' => $a->shop->logo,
                    ];
                }

                return [
                    'id' => $a->id,
                    'question_id' => $a->question_id,
                    'answer' => $a->answer,
                    'is_official' => (bool) ($a->is_official ?? true),
                    'created_at' => $a->created_at?->toIso8601String(),
                    'shop' => $shopData,
                ];
            })->values()->all();
        }

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'question' => $this->question,
            'is_public' => (bool) $this->is_public,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $userData,
            'answers' => $answersList,
        ];
    }
}
