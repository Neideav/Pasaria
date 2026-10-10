<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadApiController extends Controller
{
    /**
     * Upload an image file securely.
     *
     * Validates MIME type, content, and file size.
     * Generates random UUID filename to prevent collision and path traversal.
     * Uses configurable storage disk (local public disk or S3 cloud storage).
     */
    public function upload(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'file' => 'required|file|image|mimes:jpeg,png,jpg,webp,gif|max:5120', // max 5MB
        ], [
            'file.required' => 'File gambar wajib diunggah.',
            'file.image'    => 'File harus berupa gambar.',
            'file.mimes'    => 'Format gambar hanya diperbolehkan: jpeg, png, jpg, webp, gif.',
            'file.max'      => 'Ukuran gambar maksimal adalah 5MB.',
        ]);

        $file = $request->file('file');
        if (!$file || !$file->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Upload file gagal atau file corrupt.',
            ], 422);
        }

        try {
            // Verify real MIME type from file content
            $mimeType = $file->getMimeType();
            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!in_array($mimeType, $allowedMimes, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Konten file tidak sesuai dengan tipe gambar yang diizinkan.',
                ], 422);
            }

            // Determine storage disk from configuration (swappable without business code change)
            $disk = config('pasaria.upload_disk', 'public');

            // Safe extension
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, ['jpeg', 'png', 'jpg', 'webp', 'gif'], true)) {
                $extension = 'jpg';
            }

            // Randomized UUID filename to prevent path traversal and overwrite
            $randomFileName = Str::uuid()->toString() . '.' . $extension;
            $directory = 'products';

            // Store file to disk
            $path = Storage::disk($disk)->putFileAs($directory, $file, $randomFileName, 'public');

            if (!$path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menyimpan file ke media storage.',
                ], 500);
            }

            // Compute public URL
            $url = Storage::disk($disk)->url($path);

            return response()->json([
                'success'   => true,
                'message'   => 'Gambar berhasil diunggah.',
                'data'      => [
                    'url'       => $url,
                    'path'      => $path,
                    'filename'  => $randomFileName,
                    'mime_type' => $mimeType,
                    'size'      => $file->getSize(),
                    'disk'      => $disk,
                ],
                'url'       => $url,
                'path'      => $path,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan saat mengunggah file.',
            ], 500);
        }
    }

    /**
     * Delete an uploaded file with strict path traversal prevention.
     */
    public function delete(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'path' => 'required|string',
        ]);

        $rawPath = trim($request->input('path'));

        // Prevent path traversal
        if (str_contains($rawPath, '..') || str_contains($rawPath, '\\')) {
            return response()->json([
                'success' => false,
                'message' => 'Path file tidak valid atau berpotensi membahayakan.',
            ], 422);
        }

        // Only allow deleting files inside allowed directories
        $normalized = ltrim($rawPath, '/');
        if (!str_starts_with($normalized, 'products/') && !str_starts_with($normalized, 'reviews/')) {
            return response()->json([
                'success' => false,
                'message' => 'Path di luar direktori media yang diizinkan.',
            ], 403);
        }

        $disk = config('pasaria.upload_disk', 'public');

        if (Storage::disk($disk)->exists($normalized)) {
            Storage::disk($disk)->delete($normalized);
        }

        return response()->json([
            'success' => true,
            'message' => 'File media berhasil dihapus.',
        ]);
    }
}
