<?php

use App\Http\Controllers\FreelanceFlowController;
use Illuminate\Support\Facades\Route;

Route::get('/', [FreelanceFlowController::class, 'app']);

// A server-rendered Laravel shell is used for the Vercel coursework preview.
if (env('APP_PREVIEW', false)) {
    Route::fallback(fn () => redirect('/'));
    return;
}

Route::prefix('api')->controller(FreelanceFlowController::class)->group(function () {
    Route::get('/auth/me', 'me');
    Route::post('/auth/register', 'register');
    Route::post('/auth/login', 'login');
    Route::post('/auth/logout', 'logout');
    Route::match(['get', 'post'], '/clients', 'clients');
    Route::match(['get', 'patch'], '/clients/{id}', 'client');
    Route::match(['get', 'patch'], '/clients/{id}/privacy', 'privacy');
    Route::match(['get', 'post'], '/clients/{id}/requests', 'clientRequests');
    Route::patch('/clients/{id}/requests/{rid}/status', 'requestStatus');
    Route::get('/public/{slug}', 'publicDashboard');
    Route::post('/public/{slug}/request', 'publicRequest');
    Route::post('/track', 'track');
    Route::post('/insights/generate/{id}', 'generateInsight');
    Route::match(['get', 'post'], '/autopilot', 'autopilot');
    Route::patch('/autopilot/{id}', 'action');
    Route::match(['get', 'post'], '/reports', 'reports');
    Route::match(['get', 'patch'], '/reports/{id}', 'report');
    Route::get('/stats', 'stats');
    Route::get('/owner/stats', 'ownerStats');
    Route::get('/owner/finance', 'ownerFinance');
    Route::get('/owner/invoices', 'ownerInvoices');
    Route::get('/owner/budget', 'ownerBudget');
    Route::get('/owner/security', 'ownerSecurity');
    Route::get('/owner/uptime', 'ownerUptime');
    Route::get('/owner/requests', 'ownerRequests');
    Route::get('/insights', 'insights');
    Route::post('/seed', 'seed');
});
