<?php

use App\Http\Controllers\DemoPreviewController;
use Illuminate\Support\Facades\Route;

if (env('APP_PREVIEW', false)) {
    Route::any('/{path?}', DemoPreviewController::class)->where('path', '.*');
}
