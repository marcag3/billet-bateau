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
use App\Notifications\BookingCancellationNotification;
use App\Notifications\BookingConfirmationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicBookingCancelApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Booking, 1: string, 2: Trip, 3: TicketType}
     */
    private function createCancellableBooking(): array
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'cancel-me',
            'name' => 'Harbor Tours',
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
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
            'cancel_token_hash' => hash('sha256', $plainToken),
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

    public function test_guest_can_preview_and_cancel_booking_via_token(): void
    {
        Notification::fake();

        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'cancel-flow',
            'name' => 'Harbor Tours',
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
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

        $this->postJson('/api/public/programs/cancel-flow/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 2],
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
            'country' => 'CA',
        ])->assertCreated()
            ->assertJsonPath('data.total_tickets', 2);

        $bookingId = (string) Booking::query()->value('id');

        $plainToken = null;
        Notification::assertSentOnDemand(
            BookingConfirmationNotification::class,
            function (BookingConfirmationNotification $notification) use (&$plainToken): bool {
                $plainToken = $notification->plainCancelToken;

                return $plainToken !== null && $plainToken !== '';
            },
        );

        $this->assertNotNull($plainToken);

        $this->getJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('data.program_name', 'Harbor Tours')
            ->assertJsonPath('data.product_name', 'Sunset run')
            ->assertJsonPath('data.product_description', 'Evening cruise on the harbor.')
            ->assertJsonPath('data.product_banner_url', null)
            ->assertJsonPath('data.boat_type_banner_url', null)
            ->assertJsonPath('data.contact_name', 'Alex River');

        $this->postJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('data.program_name', 'Harbor Tours');

        Notification::assertSentOnDemand(
            BookingCancellationNotification::class,
            function (BookingCancellationNotification $notification, array $channels, object $notifiable): bool {
                return ($notifiable->routes['mail'] ?? null) === 'alex@example.com'
                    && $notification->booking->contact_email === 'alex@example.com';
            },
        );

        $this->assertDatabaseMissing('bookings', [
            'id' => $bookingId,
        ]);
        $this->assertSame(0, BookingTicket::query()->where('booking_id', $bookingId)->count());

        $this->getJson('/api/public/programs/cancel-flow/booking-options')
            ->assertOk()
            ->assertJsonPath('data.trips.0.remaining_capacity', 10);
    }

    public function test_cancel_preview_returns_invalid_for_unknown_token(): void
    {
        $token = Str::random(64);

        $this->getJson('/api/public/bookings/cancel/'.$token)
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('reason', 'invalid');
    }

    public function test_cancel_post_returns_validation_error_for_unknown_token(): void
    {
        $token = Str::random(64);

        $this->postJson('/api/public/bookings/cancel/'.$token)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token']);
    }

    public function test_cancellation_notification_mail_renders_in_english(): void
    {
        [$booking] = $this->createCancellableBooking();

        $mail = (new BookingCancellationNotification($booking, mailLocale: 'en'))->toMail(
            Notification::route('mail', 'alex@example.com'),
        );

        $this->assertStringContainsString('Cancellation confirmed — Harbor Tours', (string) $mail->subject);
        $this->assertTrue(
            collect($mail->introLines)->contains(
                static fn (string $line): bool => str_contains($line, 'has been cancelled'),
            ),
        );
    }

    public function test_cancel_is_blocked_after_trip_departure(): void
    {
        [$booking, $plainToken, $trip] = $this->createCancellableBooking();
        unset($booking);

        $trip->forceFill(['scheduled_departure_at' => now()->subHour()])->save();

        $this->getJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('reason', 'past_departure');

        $this->postJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token']);
    }

    public function test_cancel_is_blocked_when_booking_has_check_in(): void
    {
        [$booking, $plainToken, $trip] = $this->createCancellableBooking();
        $voyage = Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Draft,
        ]);

        CheckIn::factory()->forBookingAndVoyage($booking, $voyage)->create();

        $this->getJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('reason', 'checked_in');

        $this->postJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token']);
    }

    public function test_cancel_is_blocked_when_voyage_has_started(): void
    {
        [, $plainToken, $trip] = $this->createCancellableBooking();

        Voyage::factory()->forTrip($trip)->create([
            'status' => VoyageStatus::Ready,
        ]);

        $this->getJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('reason', 'voyage_started');

        $this->postJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token']);
    }

    public function test_double_cancel_returns_invalid_after_first_cancel(): void
    {
        [, $plainToken] = $this->createCancellableBooking();

        $this->postJson('/api/public/bookings/cancel/'.$plainToken)->assertOk();

        $this->getJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('reason', 'invalid');

        $this->postJson('/api/public/bookings/cancel/'.$plainToken)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token']);
    }
}
