<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('freelancer')->after('password');
            }
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('contact_email')->nullable();
            $table->string('dashboard_slug')->unique();
            $table->string('project_title')->nullable();
            $table->text('project_summary')->nullable();
            $table->timestamps();
        });

        Schema::create('tracker_events', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('event_type');
            $table->string('path')->nullable();
            $table->string('referrer')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('payload_json')->nullable();
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('privacy_settings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('field_key');
            $table->boolean('visible')->default(true);
            $table->timestamps();
            $table->unique(['client_id', 'field_key']);
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('improvement_requests', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->text('message');
            $table->string('status')->default('open')->index();
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('ai_insights', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('kind');
            $table->string('title');
            $table->text('body');
            $table->string('severity')->default('info');
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('autopilot_actions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('type');
            $table->string('title');
            $table->text('detail');
            $table->string('status')->default('pending')->index();
            $table->boolean('auto_mode')->default(false);
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('title');
            $table->string('period');
            $table->text('body_md');
            $table->string('status')->default('draft');
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('financial_records', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('type')->index();
            $table->string('category');
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('USD');
            $table->text('description')->nullable();
            $table->date('record_date')->index();
            $table->boolean('recurring')->default(false);
            $table->string('recurring_period')->nullable();
            $table->string('invoice_number')->nullable();
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('USD');
            $table->string('status')->default('draft')->index();
            $table->date('due_date')->nullable();
            $table->date('paid_date')->nullable();
            $table->text('items_json')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('security_events', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('type');
            $table->string('severity')->default('medium')->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('open')->index();
            $table->timestamp('detected_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('uptime_records', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->string('status')->default('up');
            $table->integer('response_time_ms')->nullable();
            $table->timestamp('checked_at')->nullable()->index();
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });

        Schema::create('budgets', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id')->index();
            $table->decimal('total_budget', 12, 2);
            $table->decimal('spent', 12, 2)->default(0);
            $table->string('currency')->default('USD');
            $table->string('period')->default('monthly');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        foreach (['budgets', 'uptime_records', 'security_events', 'invoices', 'financial_records', 'reports', 'autopilot_actions', 'ai_insights', 'improvement_requests', 'privacy_settings', 'tracker_events', 'clients'] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};
