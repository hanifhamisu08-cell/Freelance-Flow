<?php

// This Vercel serverless entry boots the real Laravel application in demo mode.
// The key is intentionally public and is only suitable for this read-only demo.
$demoEnvironment = [
    'APP_ENV' => 'production',
    'APP_DEBUG' => 'false',
    'APP_PREVIEW' => 'true',
    'APP_KEY' => 'base64:MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
    'SESSION_DRIVER' => 'array',
    'CACHE_STORE' => 'array',
    'QUEUE_CONNECTION' => 'sync',
    'LOG_CHANNEL' => 'stderr',
];

foreach ($demoEnvironment as $key => $value) {
    $_ENV[$key] = $_SERVER[$key] = $value;
    putenv("{$key}={$value}");
}

require dirname(__DIR__).'/vendor/autoload.php';

$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->handleRequest(\Illuminate\Http\Request::capture());
