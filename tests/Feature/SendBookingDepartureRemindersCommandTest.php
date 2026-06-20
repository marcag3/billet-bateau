<?php

namespace Tests\Feature;

use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\CheckIn;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use App\Notifications\BookingDepartureReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class SendBookingDepartureRemindersCommandTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Booking, 1: string, 2: Trip, 3: TicketType}
     */
    private function createPublicBooking(
        ?\DateTimeInterface $departureAt = null,
        ?\DateTimeInterface $reminderSentAt = null,
        bool $withCancelToken = true,
    ): array {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'reminder-test',
            'name' => 'Harbor Tours',
            'email_signature' => 'The Dock Team',
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => $departureAt ?? now()->addHours(24)->addMinutes(30),
        ]);
        $trip->product->forceFill([
            'capacity' => 10,
            'name' => 'Sunset run',
            'description' => 'Evening cruise on the harbor.',
        ])->save();
        $type = TicketType::factory()->forProgram($program)->create([
            'title' => 'Adult',
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $plainToken = Str::random(64);
        $booking = Booking::query()->create([
            'program_id' => $program->getKey(),
            'trip_id' => $trip->getKey(),
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
            'contact_locale' => 'en',
            'cancel_token_hash' => $withCancelToken ? hash('sha256', $plainToken) : null,
            'cancel_token' => $withCancelToken ? $plainToken : null,
            'departure_reminder_sent_at' => $reminderSentAt,
        ]);

        BookingTicket::query()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $type->getKey(),
            'name' => 'Alex River',
            'email' => 'alex@example.com',
            'country' => 'CA',
            'custom_fields' => [],
        ]);

        return [$booking, $plainToken, $trip, $type];
    }

    public function test_command_sends_reminder_for_booking_departing_in_24_hours(): void
    {
        Notification::fake();
        Carbon::setTestNow(now());

        [$booking, $plainToken] = $this->createPublicBooking();

        $this->artisan('bookings:send-departure-reminders')
            ->expectsOutput('Sent 1 departure reminder(s).')
            ->assertSuccessful();

        Notification::assertSentOnDemand(
            BookingDepartureReminderNotification::class,
            function (BookingDepartureReminderNotification $notification, array $channels, object $notifiable) use ($booking, $plainToken): bool {
                return ($notifiable->routes['mail'] ?? null) === 'alex@example.com'
                    && $notification->booking->is($booking)
                    && $notification->mailLocale === 'en'
                    && $notification->booking->cancel_token === $plainToken;
            },
        );

        $this->assertNotNull($booking->fresh()->departure_reminder_sent_at);
    }

    public function test_command_skips_booking_with_reminder_already_sent(): void
    {
        Notification::fake();

        $this->createPublicBooking(reminderSentAt: now());

        $this->artisan('bookings:send-departure-reminders')
            ->expectsOutput('Sent 0 departure reminder(s).')
            ->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_command_skips_booking_outside_24_hour_window(): void
    {
        Notification::fake();

        $this->createPublicBooking(departureAt: now()->addHours(48));

        $this->artisan('bookings:send-departure-reminders')
            ->expectsOutput('Sent 0 departure reminder(s).')
            ->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_command_skips_staff_booking_without_cancel_token(): void
    {
        Notification::fake();

        $this->createPublicBooking(withCancelToken: false);

        $this->artisan('bookings:send-departure-reminders')
            ->expectsOutput('Sent 0 departure reminder(s).')
            ->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_command_skips_past_departure_booking(): void
    {
        Notification::fake();

        [, , $trip] = $this->createPublicBooking(departureAt: now()->addHours(24)->addMinutes(30));
        $trip->forceFill(['scheduled_departure_at' => now()->subHour()])->save();

        $this->artisan('bookings:send-departure-reminders')
            ->expectsOutput('Sent 0 departure reminder(s).')
            ->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_command_skips_booking_with_check_in(): void
    {
        Notification::fake();

        [$booking, , $trip] = $this->createPublicBooking();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Draft,
        ]);
        CheckIn::factory()->forBookingAndVoyage($booking, $voyage)->create();

        $this->artisan('bookings:send-departure-reminders')
            ->expectsOutput('Sent 0 departure reminder(s).')
            ->assertSuccessful();

        Notification::assertNothingSent();
        $this->assertNull($booking->fresh()->departure_reminder_sent_at);
    }

    public function test_command_skips_booking_when_voyage_has_started(): void
    {
        Notification::fake();

        [, , $trip] = $this->createPublicBooking();
        Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);

        $this->artisan('bookings:send-departure-reminders')
            ->expectsOutput('Sent 0 departure reminder(s).')
            ->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_departure_reminder_notification_mail_renders_with_cancel_link(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'name' => 'Harbor Tours',
            'email_signature' => 'The Dock Team',
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addDay(),
        ]);
        $trip->product->forceFill(['name' => 'Sunset run'])->save();
        $type = TicketType::factory()->forProgram($program)->create(['title' => 'Adult']);

        $plainToken = Str::random(64);
        $booking = Booking::query()->create([
            'program_id' => $program->getKey(),
            'trip_id' => $trip->getKey(),
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
            'contact_locale' => 'en',
            'cancel_token_hash' => hash('sha256', $plainToken),
            'cancel_token' => $plainToken,
        ]);

        BookingTicket::query()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $type->getKey(),
            'name' => 'Alex River',
            'email' => 'alex@example.com',
            'country' => 'CA',
            'custom_fields' => [],
        ]);

        $booking->load([
            'program:id,name,email_signature',
            'trip:id,scheduled_departure_at,product_id',
            'trip.product:id,name,description',
            'bookingTickets.ticketType:id,title',
        ]);

        $mail = (new BookingDepartureReminderNotification($booking, mailLocale: 'en'))->toMail(
            Notification::route('mail', 'alex@example.com'),
        );

        $this->assertStringContainsString('Reminder — your booking with Harbor Tours', (string) $mail->subject);
        $this->assertSame(url('/bookings/cancel/'.$plainToken), $mail->actionUrl);
        $this->assertStringContainsString('Regards', (string) $mail->salutation);
        $this->assertStringContainsString('The Dock Team', (string) $mail->salutation);
        $this->assertStringNotContainsString('Harbor Tours', (string) $mail->salutation);
    }
}
