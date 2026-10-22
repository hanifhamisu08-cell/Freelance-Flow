<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FreelanceFlowController extends Controller
{
    private array $privacyFields = [
        'metrics' => 'Traffic metrics',
        'topPages' => 'Top pages',
        'requests' => 'Improvement requests',
        'insights' => 'AI insights',
        'reports' => 'Reports',
    ];

    public function app()
    {
        return view('app');
    }

    public function me(): JsonResponse
    {
        return response()->json(['user' => $this->sessionUser(Auth::user())]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::updateOrCreate(
            ['email' => $data['email']],
            ['name' => $data['name'], 'password' => Hash::make($data['password']), 'role' => 'freelancer']
        );
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $this->sessionUser($user), 'csrfToken' => $request->session()->token()]);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required']]);
        if (!Auth::attempt($data)) {
            return response()->json(['error' => 'Invalid credentials.'], 422);
        }
        $request->session()->regenerate();

        return response()->json(['user' => $this->sessionUser(Auth::user()), 'csrfToken' => $request->session()->token()]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true, 'csrfToken' => $request->session()->token()]);
    }

    public function clients(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if ($request->isMethod('post')) {
            $data = $request->validate([
                'name' => ['required', 'string', 'max:160'],
                'contactEmail' => ['nullable', 'email', 'max:180'],
                'projectTitle' => ['nullable', 'string', 'max:180'],
                'projectSummary' => ['nullable', 'string'],
            ]);
            $id = (string) Str::uuid();
            DB::table('clients')->insert([
                'id' => $id,
                'user_id' => $user->id,
                'name' => $data['name'],
                'contact_email' => $data['contactEmail'] ?? null,
                'dashboard_slug' => $this->uniqueSlug($data['name']),
                'project_title' => $data['projectTitle'] ?? null,
                'project_summary' => $data['projectSummary'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->createDefaultPrivacy($id);

            return response()->json(['client' => $this->clientRow($id)]);
        }

        $rows = DB::table('clients')->where('user_id', $user->id)->orderByDesc('created_at')->get();

        return response()->json(['clients' => $rows->map(fn ($c) => $this->clientListItem($c))->values()]);
    }

    public function client(Request $request, string $id): JsonResponse
    {
        $this->requireUser();
        if ($request->isMethod('patch')) {
            $data = $request->validate([
                'name' => ['nullable', 'string', 'max:160'],
                'contactEmail' => ['nullable', 'string', 'max:180'],
                'projectTitle' => ['nullable', 'string', 'max:180'],
                'projectSummary' => ['nullable', 'string'],
            ]);
            DB::table('clients')->where('id', $id)->update([
                'name' => $data['name'] ?? DB::raw('name'),
                'contact_email' => $data['contactEmail'] ?? DB::raw('contact_email'),
                'project_title' => $data['projectTitle'] ?? DB::raw('project_title'),
                'project_summary' => $data['projectSummary'] ?? DB::raw('project_summary'),
                'updated_at' => now(),
            ]);
        }

        return response()->json($this->clientDetail($id));
    }

    public function privacy(Request $request, string $id): JsonResponse
    {
        $this->requireUser();
        if ($request->isMethod('patch')) {
            foreach (($request->input('fields') ?? []) as $key => $visible) {
                if (array_key_exists($key, $this->privacyFields)) {
                    DB::table('privacy_settings')->updateOrInsert(
                        ['client_id' => $id, 'field_key' => $key],
                        ['id' => (string) Str::uuid(), 'visible' => (bool) $visible, 'updated_at' => now(), 'created_at' => now()]
                    );
                }
            }
        }

        $privacy = $this->privacyMap($id);
        return response()->json(['fields' => collect($this->privacyFields)->map(fn ($label, $key) => [
            'key' => $key,
            'label' => $label,
            'visible' => $privacy[$key] ?? true,
        ])->values()]);
    }

    public function clientRequests(Request $request, string $id): JsonResponse
    {
        $this->requireUser();
        if ($request->isMethod('post')) {
            DB::table('improvement_requests')->insert([
                'id' => (string) Str::uuid(),
                'client_id' => $id,
                'message' => $request->string('message'),
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['requests' => $this->requests($id)]);
    }

    public function requestStatus(string $id, string $rid, Request $request): JsonResponse
    {
        $this->requireUser();
        DB::table('improvement_requests')->where('id', $rid)->where('client_id', $id)->update([
            'status' => $request->string('status', 'resolved'),
            'updated_at' => now(),
        ]);

        return response()->json(['request' => DB::table('improvement_requests')->where('id', $rid)->first()]);
    }

    public function publicDashboard(string $slug): JsonResponse
    {
        $client = DB::table('clients')->where('dashboard_slug', $slug)->first();
        abort_if(!$client, 404);
        $privacy = $this->privacyMap($client->id);
        return response()->json([
            'client' => ['name' => $client->name, 'projectTitle' => $client->project_title, 'projectSummary' => $client->project_summary],
            'privacy' => $privacy,
            'metrics' => $this->metrics($client->id),
            'topPages' => $this->topPages($client->id),
        ]);
    }

    public function publicRequest(string $slug, Request $request): JsonResponse
    {
        $client = DB::table('clients')->where('dashboard_slug', $slug)->first();
        abort_if(!$client, 404);
        DB::table('improvement_requests')->insert([
            'id' => (string) Str::uuid(),
            'client_id' => $client->id,
            'message' => $request->string('message'),
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function track(Request $request): JsonResponse
    {
        $client = DB::table('clients')->where('dashboard_slug', $request->string('slug'))->first();
        abort_if(!$client, 404);
        DB::table('tracker_events')->insert([
            'id' => (string) Str::uuid(),
            'client_id' => $client->id,
            'event_type' => $request->string('event_type', 'page_view'),
            'path' => $request->string('path', '/'),
            'referrer' => $request->headers->get('referer'),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
            'payload_json' => json_encode($request->all()),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function generateInsight(string $id): JsonResponse
    {
        $this->requireUser();
        $metrics = $this->metrics($id);
        $insight = [
            'id' => (string) Str::uuid(),
            'client_id' => $id,
            'kind' => 'recommendation',
            'title' => 'Traffic momentum is ready for a client update',
            'body' => "This dashboard has {$metrics['total']} tracked events, {$metrics['last7d']} in the last 7 days. Draft a short progress note and include the strongest page activity.",
            'severity' => $metrics['last24h'] > 20 ? 'warning' : 'info',
            'created_at' => now(),
            'updated_at' => now(),
        ];
        DB::table('ai_insights')->insert($insight);

        return response()->json(['insight' => $this->insightPayload((object) $insight), 'degraded' => true]);
    }

    public function autopilot(Request $request): JsonResponse
    {
        $this->requireUser();
        if ($request->isMethod('post')) {
            $clients = DB::table('clients')->orderByDesc('created_at')->limit(3)->get();
            $created = [];
            foreach ($clients as $client) {
                $row = [
                    'id' => (string) Str::uuid(),
                    'client_id' => $client->id,
                    'type' => 'draft_report',
                    'title' => "Draft weekly update for {$client->name}",
                    'detail' => 'Summarize traffic, pending requests and recommendations for approval.',
                    'status' => 'pending',
                    'auto_mode' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                DB::table('autopilot_actions')->insert($row);
                $created[] = $this->actionPayload((object) $row, $client->name);
            }

            return response()->json(['created' => $created, 'degraded' => true]);
        }

        return response()->json([
            'actions' => $this->actions(),
            'clients' => DB::table('clients')->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function action(string $id, Request $request): JsonResponse
    {
        $this->requireUser();
        DB::table('autopilot_actions')->where('id', $id)->update([
            'status' => $request->string('status', 'approved'),
            'updated_at' => now(),
        ]);
        $row = DB::table('autopilot_actions')->where('id', $id)->first();
        $client = DB::table('clients')->where('id', $row->client_id)->first();

        return response()->json(['action' => $this->actionPayload($row, $client?->name)]);
    }

    public function reports(Request $request): JsonResponse
    {
        $this->requireUser();
        if ($request->isMethod('post')) {
            $client = DB::table('clients')->where('id', $request->string('clientId'))->first();
            abort_if(!$client, 404);
            $metrics = $this->metrics($client->id);
            $row = [
                'id' => (string) Str::uuid(),
                'client_id' => $client->id,
                'title' => "{$client->name} weekly progress report",
                'period' => $request->string('period', 'This week'),
                'body_md' => "# {$client->name} progress\n\nTracked {$metrics['total']} events with {$metrics['last7d']} visits this week.\n\nRecommended next step: review pending client requests and send a concise update.",
                'status' => 'draft',
                'created_at' => now(),
                'updated_at' => now(),
            ];
            DB::table('reports')->insert($row);

            return response()->json(['report' => $this->reportPayload((object) $row, $client->name), 'degraded' => true]);
        }

        return response()->json(['reports' => $this->reportsList()]);
    }

    public function report(string $id, Request $request): JsonResponse
    {
        $this->requireUser();
        if ($request->isMethod('patch')) {
            DB::table('reports')->where('id', $id)->update(array_filter([
                'status' => $request->input('status'),
                'body_md' => $request->input('bodyMd'),
                'updated_at' => now(),
            ], fn ($value) => $value !== null));
        }
        $row = DB::table('reports')->where('id', $id)->first();
        $client = DB::table('clients')->where('id', $row->client_id)->first();

        return response()->json(['report' => $this->reportPayload($row, $client?->name), 'clientName' => $client?->name]);
    }

    public function stats(): JsonResponse
    {
        $this->requireUser();
        return response()->json([
            'autopilotEngaged' => DB::table('autopilot_actions')->where('status', 'pending')->exists(),
            'hoursSaved' => DB::table('autopilot_actions')->count() * 2,
            'autoHandled' => DB::table('autopilot_actions')->whereIn('status', ['auto_done', 'approved', 'sent'])->count(),
            'awaitingReview' => DB::table('autopilot_actions')->where('status', 'pending')->count(),
            'insightCount' => DB::table('ai_insights')->count(),
            'reportCount' => DB::table('reports')->count(),
            'eventCount' => DB::table('tracker_events')->count(),
            'pendingRequests' => DB::table('improvement_requests')->where('status', 'open')->count(),
            'clientCount' => DB::table('clients')->count(),
        ]);
    }

    public function ownerStats(): JsonResponse
    {
        $user = $this->requireOwner();
        $clients = DB::table('clients')->where('owner_id', $user->id)->get(['id', 'name']);
        $ids = $clients->pluck('id')->all();
        $financial = $ids ? DB::table('financial_records')->whereIn('client_id', $ids)->get() : collect();
        $security = $ids ? DB::table('security_events')->whereIn('client_id', $ids)->orderByDesc('detected_at')->get() : collect();
        $uptime = $ids ? DB::table('uptime_records')->whereIn('client_id', $ids)->get() : collect();
        $invoices = $ids ? DB::table('invoices')->whereIn('client_id', $ids)->get() : collect();
        $budgets = $ids ? DB::table('budgets')->whereIn('client_id', $ids)->get() : collect();

        $totalRevenue = (float) $financial->where('type', 'revenue')->sum(fn ($r) => (float) $r->amount);
        $totalExpenses = (float) $financial->where('type', 'expense')->sum(fn ($r) => (float) $r->amount);
        $openSecurity = $security->filter(fn ($e) => in_array($e->status, ['open', 'investigating'], true));
        $grade = $this->securityGrade($openSecurity);
        $upCount = $uptime->where('status', 'up')->count();
        $uptimePercent = $uptime->isEmpty() ? 100 : round($upCount / $uptime->count() * 100, 2);
        $clientNames = $clients->pluck('name', 'id');
        $recentAlerts = $openSecurity->take(5)->map(fn ($e) => [
            'id' => $e->id, 'title' => $e->title ?: "{$e->type} — {$e->severity}",
            'severity' => $e->severity, 'status' => $e->status, 'type' => $e->type,
            'clientName' => $clientNames[$e->client_id] ?? 'Unknown', 'detectedAt' => $e->detected_at,
        ])->values();
        $outstanding = $invoices->filter(fn ($i) => in_array($i->status, ['sent', 'overdue'], true));
        $monthlyRevenue = collect(range(3, 0))->map(function ($monthsAgo) use ($financial) {
            $month = now()->startOfMonth()->subMonths($monthsAgo);
            $revenue = $financial->filter(fn ($r) => $r->type === 'revenue' && substr((string) $r->created_at, 0, 7) === $month->format('Y-m'))
                ->sum(fn ($r) => (float) $r->amount);
            return ['month' => $month->format('M'), 'revenue' => (float) $revenue];
        })->values();
        $clientStats = $clients->map(function ($client) use ($financial, $security, $uptime, $invoices, $budgets) {
            $clientFinancial = $financial->where('client_id', $client->id);
            $clientSecurity = $security->where('client_id', $client->id);
            $clientUptime = $uptime->where('client_id', $client->id);
            $clientInvoices = $invoices->where('client_id', $client->id);
            $clientBudgets = $budgets->where('client_id', $client->id);
            $revenue = (float) $clientFinancial->where('type', 'revenue')->sum(fn ($r) => (float) $r->amount);
            $expenses = (float) $clientFinancial->where('type', 'expense')->sum(fn ($r) => (float) $r->amount);
            $open = $clientSecurity->filter(fn ($e) => in_array($e->status, ['open', 'investigating'], true));
            return [
                'clientId' => $client->id, 'clientName' => $client->name, 'revenue' => $revenue,
                'expenses' => $expenses, 'netProfit' => $revenue - $expenses,
                'activeBugs' => $open->where('type', 'bug')->count(),
                'uptimePercent' => $clientUptime->isEmpty() ? 100 : round($clientUptime->where('status', 'up')->count() / $clientUptime->count() * 100, 2),
                'securityScore' => $this->securityGrade($open), 'totalInvoices' => $clientInvoices->count(),
                'paidInvoices' => $clientInvoices->where('status', 'paid')->count(),
                'outstandingInvoices' => $clientInvoices->filter(fn ($i) => in_array($i->status, ['sent', 'overdue'], true))->count(),
                'budgetTotal' => (float) $clientBudgets->sum(fn ($b) => (float) $b->total_budget),
                'budgetSpent' => (float) $clientBudgets->sum(fn ($b) => (float) $b->spent),
            ];
        })->values();

        $gradeMap = ['A' => ['grade' => 'A', 'score' => 95, 'color' => '#22c55e'], 'B' => ['grade' => 'B', 'score' => 80, 'color' => '#84cc16'], 'C' => ['grade' => 'C', 'score' => 65, 'color' => '#eab308'], 'D' => ['grade' => 'D', 'score' => 45, 'color' => '#f97316'], 'F' => ['grade' => 'F', 'score' => 25, 'color' => '#ef4444']];
        return response()->json([
            'totalRevenue' => $totalRevenue, 'totalExpenses' => $totalExpenses, 'netProfit' => $totalRevenue - $totalExpenses,
            'activeBugs' => $openSecurity->where('type', 'bug')->count(), 'uptimePercent' => $uptimePercent,
            'securityScore' => $gradeMap[$grade], 'totalInvoices' => $invoices->count(),
            'paidInvoices' => $invoices->where('status', 'paid')->count(), 'outstandingInvoices' => $outstanding->count(),
            'recentAlerts' => $recentAlerts,
            'outstandingInvoicesList' => $outstanding->map(fn ($i) => [
                'id' => $i->id, 'clientName' => $clientNames[$i->client_id] ?? 'Unknown',
                'amount' => (float) $i->amount, 'status' => $i->status, 'dueDate' => $i->due_date ?: 'TBD',
            ])->values(),
            'monthlyRevenue' => $monthlyRevenue, 'clientStats' => $clientStats,
        ]);
    }

    public function ownerFinance(Request $request): JsonResponse
    {
        $user = $this->requireOwner();
        $clients = DB::table('clients')->where('owner_id', $user->id)->get(['id', 'name']);
        $ids = $clients->pluck('id')->all();
        $query = DB::table('financial_records')->whereIn('client_id', $ids);
        $type = $request->query('type');
        if (in_array($type, ['revenue', 'expense'], true)) $query->where('type', $type);
        $records = $query->orderByDesc('record_date')->get();
        $names = $clients->pluck('name', 'id');
        $all = $ids ? DB::table('financial_records')->whereIn('client_id', $ids)->get() : collect();
        $monthly = collect(range(5, 0))->map(function ($monthsAgo) use ($all) {
            $month = now()->startOfMonth()->subMonths($monthsAgo);
            $rows = $all->filter(fn ($r) => substr((string) $r->record_date, 0, 7) === $month->format('Y-m'));
            $revenue = (float) $rows->where('type', 'revenue')->sum(fn ($r) => (float) $r->amount);
            $expenses = (float) $rows->where('type', 'expense')->sum(fn ($r) => (float) $r->amount);
            return ['month' => $month->format('M y'), 'revenue' => $revenue, 'expenses' => $expenses, 'net' => $revenue - $expenses];
        })->values();
        return response()->json([
            'records' => $records->map(fn ($r) => [
                'id' => $r->id, 'clientId' => $r->client_id, 'clientName' => $names[$r->client_id] ?? 'Unknown',
                'type' => $r->type, 'category' => $r->category, 'amount' => (float) $r->amount,
                'currency' => $r->currency, 'description' => $r->description ?? '', 'recordDate' => $r->record_date,
                'recurring' => (bool) $r->recurring, 'recurringPeriod' => $r->recurring_period,
                'invoiceNumber' => $r->invoice_number, 'createdAt' => $r->created_at,
            ])->values(),
            'monthly' => $monthly,
            'totalRevenue' => (float) $all->where('type', 'revenue')->sum(fn ($r) => (float) $r->amount),
            'totalExpenses' => (float) $all->where('type', 'expense')->sum(fn ($r) => (float) $r->amount),
        ]);
    }

    public function ownerInvoices(): JsonResponse
    {
        $user = $this->requireOwner();
        $clients = DB::table('clients')->where('owner_id', $user->id)->get(['id', 'name']);
        $ids = $clients->pluck('id')->all();
        $names = $clients->pluck('name', 'id');
        $invoices = $ids ? DB::table('invoices')->whereIn('client_id', $ids)->orderByDesc('created_at')->get() : collect();
        $order = ['overdue' => 0, 'sent' => 1, 'draft' => 2, 'paid' => 3];
        $invoices = $invoices->sort(function ($a, $b) use ($order) {
            return ($order[$a->status] ?? 99) <=> ($order[$b->status] ?? 99) ?: strcmp($b->created_at, $a->created_at);
        })->values();
        return response()->json([
            'invoices' => $invoices->map(fn ($i) => [
                'id' => $i->id, 'clientId' => $i->client_id, 'clientName' => $names[$i->client_id] ?? 'Unknown',
                'amount' => (float) $i->amount, 'currency' => $i->currency, 'status' => $i->status,
                'dueDate' => $i->due_date, 'paidDate' => $i->paid_date, 'itemsJson' => $i->items_json,
                'notes' => $i->notes, 'createdAt' => $i->created_at, 'updatedAt' => $i->updated_at,
            ]),
            'totalInvoiced' => (float) $invoices->sum(fn ($i) => (float) $i->amount),
            'paid' => (float) $invoices->where('status', 'paid')->sum(fn ($i) => (float) $i->amount),
            'outstanding' => (float) $invoices->filter(fn ($i) => in_array($i->status, ['sent', 'overdue'], true))->sum(fn ($i) => (float) $i->amount),
        ]);
    }

    public function ownerBudget(): JsonResponse
    {
        $user = $this->requireOwner();
        $clients = DB::table('clients')->where('owner_id', $user->id)->get(['id', 'name']);
        $ids = $clients->pluck('id')->all();
        $names = $clients->pluck('name', 'id');
        $budgets = $ids ? DB::table('budgets')->whereIn('client_id', $ids)->orderByDesc('created_at')->get() : collect();
        return response()->json(['budgets' => $budgets->map(function ($b) use ($names) {
            $total = (float) $b->total_budget;
            $spent = (float) $b->spent;
            return [
                'id' => $b->id, 'clientId' => $b->client_id, 'clientName' => $names[$b->client_id] ?? 'Unknown',
                'totalBudget' => $total, 'spent' => $spent, 'remaining' => $total - $spent,
                'percentage' => $total > 0 ? round($spent / $total * 100, 2) : 0,
                'currency' => $b->currency, 'period' => $b->period, 'startDate' => $b->start_date,
                'endDate' => $b->end_date, 'createdAt' => $b->created_at,
            ];
        })->values()]);
    }

    public function ownerSecurity(Request $request): JsonResponse
    {
        $user = $this->requireOwner();
        $clients = DB::table('clients')->where('owner_id', $user->id)->get(['id', 'name']);
        $ids = $clients->pluck('id')->all();
        $names = $clients->pluck('name', 'id');
        $all = $ids ? DB::table('security_events')->whereIn('client_id', $ids)->orderByDesc('detected_at')->get() : collect();
        $events = $all->filter(fn ($e) => (!$request->query('severity') || $e->severity === $request->query('severity'))
            && (!$request->query('status') || $e->status === $request->query('status'))
            && (!$request->query('type') || $e->type === $request->query('type')))->map(fn ($e) => [
                'id' => $e->id, 'clientId' => $e->client_id, 'clientName' => $names[$e->client_id] ?? 'Unknown',
                'type' => $e->type, 'severity' => $e->severity, 'title' => $e->title,
                'description' => $e->description, 'status' => $e->status,
                'detectedAt' => $e->detected_at, 'resolvedAt' => $e->resolved_at,
            ])->values();
        $scores = $clients->map(function ($client) use ($all) {
            $grade = $this->securityGrade($all->where('client_id', $client->id)->filter(fn ($e) => in_array($e->status, ['open', 'investigating'], true)));
            $grades = ['A' => [95, '#22c55e'], 'B' => [80, '#84cc16'], 'C' => [65, '#eab308'], 'D' => [45, '#f97316'], 'F' => [25, '#ef4444']];
            return ['clientId' => $client->id, 'clientName' => $client->name, 'grade' => $grade, 'score' => $grades[$grade][0], 'color' => $grades[$grade][1]];
        })->values();
        return response()->json(['events' => $events, 'scores' => $scores]);
    }

    public function ownerUptime(): JsonResponse
    {
        $user = $this->requireOwner();
        $clients = DB::table('clients')->where('owner_id', $user->id)->get(['id', 'name']);
        $ids = $clients->pluck('id')->all();
        $records = $ids ? DB::table('uptime_records')->whereIn('client_id', $ids)->where('checked_at', '>=', now()->subDays(7))->orderBy('checked_at')->get() : collect();
        $results = $clients->map(function ($client) use ($records) {
            $rows = $records->where('client_id', $client->id)->values();
            $up = $rows->where('status', 'up');
            $grid = [];
            foreach ($rows as $row) {
                if (!$row->checked_at) continue;
                $checked = Carbon::parse($row->checked_at);
                $day = ((int) $checked->dayOfWeekIso) - 1;
                $hour = (int) $checked->format('G');
                $key = "$day-$hour";
                $rank = ['up' => 0, 'degraded' => 1, 'down' => 2];
                if (!isset($grid[$key]) || ($rank[$row->status] ?? 0) > ($rank[$grid[$key]] ?? 0)) $grid[$key] = $row->status;
            }
            $hourly = [];
            for ($day = 0; $day < 7; $day++) for ($hour = 0; $hour < 24; $hour++) $hourly[] = ['day' => $day, 'hour' => $hour, 'status' => $grid["$day-$hour"] ?? 'up'];
            $lastDown = $rows->filter(fn ($r) => $r->status === 'down')->last();
            $responseTimes = $up->filter(fn ($r) => $r->response_time_ms !== null)->pluck('response_time_ms');
            return [
                'clientId' => $client->id, 'clientName' => $client->name,
                'uptimePercent' => $rows->isEmpty() ? 100 : round($up->count() / $rows->count() * 100, 2),
                'avgResponseMs' => $responseTimes->isEmpty() ? 0 : (int) round($responseTimes->avg()),
                'lastIncident' => $lastDown?->checked_at,
                'hourly' => $hourly,
            ];
        })->values();
        return response()->json(['clients' => $results]);
    }

    public function ownerRequests(): JsonResponse
    {
        $user = $this->requireOwner();
        $rows = DB::table('improvement_requests')->join('clients', 'clients.id', '=', 'improvement_requests.client_id')
            ->where('clients.owner_id', $user->id)->select('improvement_requests.*', 'clients.name as client_name')
            ->orderByDesc('improvement_requests.created_at')->get();
        return response()->json(['requests' => $rows->map(fn ($r) => [
            'id' => $r->id, 'clientId' => $r->client_id, 'clientName' => $r->client_name,
            'message' => $r->message, 'status' => $r->status, 'createdAt' => $r->created_at,
        ])]);
    }

    public function insights(): JsonResponse
    {
        $user = $this->requireUser();
        $ids = DB::table('clients')->where('user_id', $user->id)->pluck('id');
        $rows = $ids->isEmpty() ? collect() : DB::table('ai_insights')->whereIn('client_id', $ids)->orderByDesc('created_at')->get();
        return response()->json(['insights' => $rows->map(fn ($r) => $this->insightPayload($r))->values()]);
    }

    public function seed(): JsonResponse
    {
        $user = User::firstOrCreate(
            ['email' => 'founder@freelanceflow.app'],
            ['name' => 'Flow Founder', 'password' => Hash::make('prototype123'), 'role' => 'freelancer']
        );
        $owner = User::updateOrCreate(
            ['email' => 'owner@demo.com'],
            ['name' => 'Demo Owner', 'password' => Hash::make('owner123'), 'role' => 'owner']
        );

        $clients = [
            ['Northstar Studio', 'northstar@example.com', 'Portfolio relaunch', 'New public site, analytics, and client-ready reporting.'],
            ['Luma Dental', 'ops@lumadental.test', 'Booking conversion dashboard', 'Tracking patient inquiries and website improvement requests.'],
            ['Crestline Legal', 'hello@crestline.test', 'Lead quality portal', 'Live client visibility for traffic, requests, and weekly reporting.'],
        ];

        $seeded = 0;
        foreach ($clients as [$name, $email, $title, $summary]) {
            $client = DB::table('clients')->where('name', $name)->first();
            if (!$client) {
                $id = (string) Str::uuid();
                DB::table('clients')->insert([
                    'id' => $id,
                    'user_id' => $user->id,
                    'owner_id' => $owner->id,
                    'name' => $name,
                    'contact_email' => $email,
                    'dashboard_slug' => $this->uniqueSlug($name),
                    'project_title' => $title,
                    'project_summary' => $summary,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->createDefaultPrivacy($id);
                $seeded++;
            } else {
                $id = $client->id;
                DB::table('clients')->where('id', $id)->update([
                    'user_id' => $user->id,
                    'owner_id' => $owner->id,
                    'updated_at' => now(),
                ]);
            }

            if (!DB::table('tracker_events')->where('client_id', $id)->exists()) {
                $paths = ['/', '/pricing', '/work', '/contact', '/dashboard'];
                $hourlyCounts = [1, 0, 1, 1, 2, 1, 0, 3, 1, 0, 2, 1, 0, 1, 2, 0, 3, 1, 0, 2, 1, 0, 1, 0];
                $pathIndex = 0;
                foreach ($hourlyCounts as $hourIndex => $count) {
                    for ($visit = 0; $visit < $count; $visit++) {
                        DB::table('tracker_events')->insert([
                            'id' => (string) Str::uuid(),
                            'client_id' => $id,
                            'event_type' => 'page_view',
                            'path' => $paths[$pathIndex++ % count($paths)],
                            'created_at' => now()->subHours(23 - $hourIndex)->subMinutes(rand(10, 45)),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
            if (!DB::table('improvement_requests')->where('client_id', $id)->exists()) DB::table('improvement_requests')->insert([
                'id' => (string) Str::uuid(),
                'client_id' => $id,
                'message' => 'Can we add a clearer CTA above the fold?',
                'status' => 'open',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ]);
            if (!DB::table('ai_insights')->where('client_id', $id)->exists()) DB::table('ai_insights')->insert([
                'id' => (string) Str::uuid(),
                'client_id' => $id,
                'kind' => 'summary',
                'title' => 'Homepage and contact traffic are leading',
                'body' => 'Recent visits cluster around conversion pages. A short update would reassure the client that momentum is visible.',
                'severity' => 'info',
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay(),
            ]);
            if (!DB::table('financial_records')->where('client_id', $id)->exists()) DB::table('financial_records')->insert([
                'id' => (string) Str::uuid(),
                'client_id' => $id,
                'type' => 'revenue',
                'category' => 'Retainer',
                'amount' => rand(1800, 4600),
                'record_date' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if (!DB::table('invoices')->where('client_id', $id)->exists()) DB::table('invoices')->insert([
                'id' => (string) Str::uuid(),
                'client_id' => $id,
                'amount' => rand(1200, 5200),
                'status' => collect(['sent', 'paid', 'overdue'])->random(),
                'due_date' => now()->addDays(rand(3, 20))->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if (!DB::table('security_events')->where('client_id', $id)->exists()) DB::table('security_events')->insert([
                'id' => (string) Str::uuid(),
                'client_id' => $id,
                'type' => collect(['bug', 'ssl_expiry', 'uptime_change'])->random(),
                'severity' => collect(['low', 'medium', 'high'])->random(),
                'title' => 'Routine monitor item',
                'description' => 'Seeded operational signal for the owner dashboard.',
                'detected_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if (!DB::table('uptime_records')->where('client_id', $id)->exists()) DB::table('uptime_records')->insert([
                'id' => (string) Str::uuid(),
                'client_id' => $id,
                'status' => 'up',
                'response_time_ms' => rand(90, 420),
                'checked_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if (!DB::table('budgets')->where('client_id', $id)->exists()) {
                DB::table('budgets')->insert([
                    'id' => (string) Str::uuid(), 'client_id' => $id, 'total_budget' => 8000,
                    'spent' => rand(2400, 6800), 'start_date' => now()->startOfMonth()->toDateString(),
                    'updated_at' => now(), 'created_at' => now(),
                ]);
            }
        }

        return response()->json(['ok' => true, 'seeded' => $seeded]);
    }

    private function requireUser(): User
    {
        abort_unless(Auth::check(), 401, 'Unauthenticated.');
        return Auth::user();
    }

    private function requireOwner(): User
    {
        $user = $this->requireUser();
        abort_unless($user->role === 'owner', 403, 'Business owner access required.');
        return $user;
    }

    private function securityGrade($events): string
    {
        $critical = $events->where('severity', 'critical')->count();
        $high = $events->where('severity', 'high')->count();
        $medium = $events->where('severity', 'medium')->count();
        if ($critical > 0) return 'F';
        if ($high > 2) return 'D';
        if ($high > 0 || $medium > 5) return 'C';
        if ($medium > 2) return 'B';
        return 'A';
    }

    private function sessionUser(?User $user): ?array
    {
        return $user ? ['id' => (string) $user->id, 'email' => $user->email, 'name' => $user->name, 'role' => $user->role ?? 'freelancer'] : null;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'client';
        $slug = $base;
        $i = 2;
        while (DB::table('clients')->where('dashboard_slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }

    private function createDefaultPrivacy(string $clientId): void
    {
        foreach ($this->privacyFields as $key => $label) {
            DB::table('privacy_settings')->updateOrInsert(
                ['client_id' => $clientId, 'field_key' => $key],
                ['id' => (string) Str::uuid(), 'visible' => true, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    private function clientRow(string $id): array
    {
        $c = DB::table('clients')->where('id', $id)->first();
        return [
            'id' => $c->id,
            'name' => $c->name,
            'contactEmail' => $c->contact_email,
            'dashboardSlug' => $c->dashboard_slug,
            'projectTitle' => $c->project_title,
            'projectSummary' => $c->project_summary,
            'createdAt' => $c->created_at,
        ];
    }

    private function clientListItem(object $c): array
    {
        return $this->clientRow($c->id) + [
            'eventCount' => DB::table('tracker_events')->where('client_id', $c->id)->count(),
            'requestCount' => DB::table('improvement_requests')->where('client_id', $c->id)->count(),
            'insightCount' => DB::table('ai_insights')->where('client_id', $c->id)->count(),
            'actionCount' => DB::table('autopilot_actions')->where('client_id', $c->id)->count(),
            'lastActivity' => DB::table('tracker_events')->where('client_id', $c->id)->max('created_at'),
        ];
    }

    private function clientDetail(string $id): array
    {
        return [
            'client' => $this->clientRow($id),
            'privacy' => $this->privacyMap($id),
            'events' => DB::table('tracker_events')->where('client_id', $id)->orderByDesc('created_at')->limit(60)->get()->map(fn ($e) => [
                'id' => $e->id,
                'createdAt' => $e->created_at,
                'path' => $e->path,
                'eventType' => $e->event_type,
                'referrer' => $e->referrer,
                'userAgent' => $e->user_agent,
                'ipAddress' => $e->ip_address,
            ]),
            'metrics' => $this->metrics($id),
            'requests' => $this->requests($id),
            'insights' => DB::table('ai_insights')->where('client_id', $id)->orderByDesc('created_at')->get()->map(fn ($r) => $this->insightPayload($r)),
            'actions' => DB::table('autopilot_actions')->where('client_id', $id)->orderByDesc('created_at')->get()->map(fn ($r) => $this->actionPayload($r)),
            'reports' => DB::table('reports')->where('client_id', $id)->orderByDesc('created_at')->get()->map(fn ($r) => $this->reportPayload($r)),
        ];
    }

    private function privacyMap(string $id): array
    {
        $rows = DB::table('privacy_settings')->where('client_id', $id)->pluck('visible', 'field_key')->all();
        return collect($this->privacyFields)->mapWithKeys(fn ($label, $key) => [$key => array_key_exists($key, $rows) ? (bool) $rows[$key] : true])->all();
    }

    private function metrics(string $id): array
    {
        $now = now();
        return [
            'total' => DB::table('tracker_events')->where('client_id', $id)->count(),
            'last24h' => DB::table('tracker_events')->where('client_id', $id)->where('created_at', '>=', $now->copy()->subDay())->count(),
            'last7d' => DB::table('tracker_events')->where('client_id', $id)->where('created_at', '>=', $now->copy()->subDays(7))->count(),
            'hourly' => collect(range(23, 0))->map(fn ($h) => [
                'ts' => $now->copy()->subHours($h)->toIso8601String(),
                'count' => DB::table('tracker_events')->where('client_id', $id)->whereBetween('created_at', [$now->copy()->subHours($h + 1), $now->copy()->subHours($h)])->count(),
            ])->values(),
            'topPages' => $this->topPages($id),
            'lastEvent' => DB::table('tracker_events')->where('client_id', $id)->max('created_at'),
        ];
    }

    private function topPages(string $id)
    {
        return DB::table('tracker_events')
            ->select('path', DB::raw('count(*) as count'))
            ->where('client_id', $id)
            ->groupBy('path')
            ->orderByDesc('count')
            ->limit(6)
            ->get();
    }

    private function requests(string $id)
    {
        return DB::table('improvement_requests')->where('client_id', $id)->orderByDesc('created_at')->get()->map(fn ($r) => [
            'id' => $r->id,
            'clientId' => $r->client_id,
            'message' => $r->message,
            'status' => $r->status,
            'createdAt' => $r->created_at,
        ]);
    }

    private function actions()
    {
        return DB::table('autopilot_actions')
            ->join('clients', 'clients.id', '=', 'autopilot_actions.client_id')
            ->select('autopilot_actions.*', 'clients.name as client_name')
            ->orderByDesc('autopilot_actions.created_at')
            ->get()
            ->map(fn ($r) => $this->actionPayload($r, $r->client_name));
    }

    private function reportsList()
    {
        return DB::table('reports')
            ->join('clients', 'clients.id', '=', 'reports.client_id')
            ->select('reports.*', 'clients.name as client_name')
            ->orderByDesc('reports.created_at')
            ->get()
            ->map(fn ($r) => $this->reportPayload($r, $r->client_name));
    }

    private function insightPayload(object $r): array
    {
        return ['id' => $r->id, 'clientId' => $r->client_id, 'kind' => $r->kind, 'title' => $r->title, 'body' => $r->body, 'severity' => $r->severity, 'createdAt' => $r->created_at];
    }

    private function actionPayload(object $r, ?string $clientName = null): array
    {
        return ['id' => $r->id, 'clientId' => $r->client_id, 'type' => $r->type, 'title' => $r->title, 'detail' => $r->detail, 'status' => $r->status, 'autoMode' => (bool) $r->auto_mode, 'createdAt' => $r->created_at, 'updatedAt' => $r->updated_at, 'clientName' => $clientName];
    }

    private function reportPayload(object $r, ?string $clientName = null): array
    {
        return ['id' => $r->id, 'clientId' => $r->client_id, 'title' => $r->title, 'period' => $r->period, 'bodyMd' => $r->body_md, 'status' => $r->status, 'createdAt' => $r->created_at, 'updatedAt' => $r->updated_at, 'clientName' => $clientName];
    }
}
