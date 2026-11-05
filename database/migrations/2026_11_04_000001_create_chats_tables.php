<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Live chat: a site visitor (guest or signed-in) talks to staff from the chat bubble; staff answer from /admin/chats.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 120);
            $table->string('email', 190)->nullable();
            $table->timestamp('last_message_at')->nullable()->index();
            // Visitor messages after this are unread for staff.
            $table->timestamp('staff_read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            // visitor | staff | bot (keyword auto-answer while queued) | system (e.g. "Laura joined", body = staff name)
            $table->string('kind', 10)->default('visitor');
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            // Bot messages: which ChatBot topic was answered, for follow-up suggestions and repeat detection.
            $table->string('topic', 20)->nullable();
            $table->text('body');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chats');
    }
};
