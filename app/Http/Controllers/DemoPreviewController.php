<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Stateless, database-free API for the hosted classroom demonstration.
 * Every request reads the same seeded fixtures; demo mutations are temporary.
 */
class DemoPreviewController extends Controller
{
    public function __invoke(Request $request, ?string $path = null): JsonResponse
    {
        $data = json_decode(file_get_contents(base_path('static/demo-data.json')), true, flags: JSON_THROW_ON_ERROR);
        $freelancer = $data['freelancer'];
        $owner = $data['owner'];
        $path = '/'.ltrim((string) $path, '/');
        $method = $request->method();

        if ($path === '/auth/me') return response()->json(['user' => null]);
        if ($path === '/auth/login' || $path === '/auth/register') {
            $email = strtolower((string) $request->input('email'));
            $profiles = [
                'founder@freelanceflow.app' => ['id' => 'demo-freelancer', 'email' => 'founder@freelanceflow.app', 'name' => 'Flow Founder', 'role' => 'freelancer'],
                'owner@demo.com' => ['id' => 'demo-owner', 'email' => 'owner@demo.com', 'name' => 'Demo Owner', 'role' => 'owner'],
            ];
            $user = $path === '/auth/register'
                ? ['id' => 'demo-new-user', 'email' => $email, 'name' => $request->input('name', 'Demo Freelancer'), 'role' => 'freelancer']
                : ($profiles[$email] ?? null);
            return $user
                ? response()->json(['user' => $user, 'csrfToken' => 'demo-preview-token'])
                : response()->json(['error' => 'Choose one of the demo accounts shown below.'], 422);
        }
        if ($path === '/auth/logout') return response()->json(['ok' => true, 'csrfToken' => 'demo-preview-token']);
        if ($path === '/seed') return response()->json(['ok' => true, 'seeded' => count($freelancer['clients'])]);
        if ($path === '/clients' && $method === 'GET') return response()->json(['clients' => $freelancer['clients']]);
        if ($path === '/clients' && $method === 'POST') {
            return response()->json(['client' => [
                'id' => 'demo-new-client', 'name' => $request->input('name', 'New demo client'),
                'contactEmail' => $request->input('contactEmail'), 'dashboardSlug' => 'new-demo-client',
                'projectTitle' => $request->input('projectTitle', 'Prototype project'),
                'projectSummary' => $request->input('projectSummary', 'Sample project in the FreelanceFlow preview.'),
                'createdAt' => now()->toISOString(), 'eventCount' => 0, 'requestCount' => 0,
                'insightCount' => 0, 'actionCount' => 0, 'lastActivity' => null,
            ]]);
        }
        if ($path === '/stats') return response()->json($freelancer['stats']);
        if ($path === '/insights') return response()->json($freelancer['insights']);
        if ($path === '/autopilot') return response()->json($method === 'POST' ? ['created' => [], 'degraded' => false] : $freelancer['autopilot']);
        if ($path === '/reports') return response()->json($method === 'POST'
            ? ['report' => null, 'degraded' => false, 'message' => 'Demo preview: report generation is simulated.']
            : $freelancer['reports']);

        $ownerEndpoints = [
            '/owner/stats' => 'stats', '/owner/finance' => 'finance', '/owner/invoices' => 'invoices',
            '/owner/budget' => 'budget', '/owner/uptime' => 'uptime', '/owner/requests' => 'requests',
        ];
        if (isset($ownerEndpoints[$path])) return response()->json($owner[$ownerEndpoints[$path]]);
        if ($path === '/owner/security') return response()->json($request->query('type') ? $owner['bugs'] : $owner['security']);

        if (preg_match('#^/clients/([^/]+)(?:/(.*))?$#', $path, $matches)) {
            $id = $matches[1];
            $suffix = $matches[2] ?? '';
            $detail = collect($freelancer['clientDetails'])->firstWhere('client.id', $id);
            if (!$detail) return response()->json(['error' => 'Demo client not found.'], 404);
            if ($suffix === '' && $method === 'GET') {
                $detail['metrics'] = $this->freshMetrics($detail['metrics']);
                foreach ($detail['events'] as $index => &$event) $event['createdAt'] = now()->subMinutes($index * 30)->toISOString();
                unset($event);
                return response()->json($detail);
            }
            if ($suffix === 'privacy') {
                $labels = ['metrics' => 'Traffic metrics', 'topPages' => 'Top pages', 'requests' => 'Improvement requests', 'insights' => 'AI insights', 'reports' => 'Reports'];
                $fields = collect($detail['privacy'])->map(fn ($visible, $key) => ['key' => $key, 'label' => $labels[$key] ?? $key, 'visible' => $visible])->values();
                return response()->json(['fields' => $fields]);
            }
            if ($suffix === 'requests' && $method === 'POST') return response()->json(['request' => ['id' => 'demo-request', 'clientId' => $id, 'message' => $request->input('message', 'Demo request'), 'status' => 'open', 'createdAt' => now()->toISOString()]]);
            if ($suffix === 'requests') return response()->json(['requests' => $detail['requests']]);
        }

        if (preg_match('#^/public/([^/]+)$#', $path, $matches)) {
            $public = collect($freelancer['publicClients'])->first(fn ($entry) => data_get($entry, 'client.dashboardSlug') === $matches[1]);
            if (!$public) return response()->json(['error' => 'Demo client not found.'], 404);
            $public['metrics'] = $this->freshMetrics($public['metrics']);
            return response()->json($public);
        }
        if (str_starts_with($path, '/public/') || $path === '/track') return response()->json(['ok' => true]);
        if (str_starts_with($path, '/insights/generate/')) return response()->json(['insight' => $freelancer['insights']['insights'][0] ?? null, 'degraded' => false]);
        if (preg_match('#^/reports/([^/]+)$#', $path, $matches)) {
            $report = collect($freelancer['reports']['reports'])->firstWhere('id', $matches[1]) ?? ($freelancer['reports']['reports'][0] ?? null);
            return response()->json(['report' => $report, 'clientName' => $report['clientName'] ?? 'Demo client']);
        }
        if (str_starts_with($path, '/autopilot/')) return response()->json(['action' => $freelancer['autopilot']['actions'][0] ?? (object) [], 'degraded' => false]);

        return response()->json(['error' => 'This action is not part of the read-only demo preview.']);
    }

    private function freshMetrics(array $metrics): array
    {
        $counts = array_column($metrics['hourly'] ?? [], 'count');
        $metrics['hourly'] = array_map(fn ($hour, $index) => [...$hour, 'ts' => now()->subHours(count($counts) - $index - 1)->toISOString()], $metrics['hourly'] ?? [], array_keys($metrics['hourly'] ?? []));
        $metrics['last24h'] = array_sum($counts);
        $metrics['last7d'] = max((int) ($metrics['last7d'] ?? 0), $metrics['last24h']);
        $metrics['lastEvent'] = now()->toISOString();
        return $metrics;
    }
}
