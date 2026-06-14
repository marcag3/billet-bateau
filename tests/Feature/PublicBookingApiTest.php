<?php

namespace Tests\Feature;

use App\Models\BoatType;
use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use App\Models\User;
use App\Models\WaterRoute;
use App\Notifications\BookingConfirmationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicBookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_options_returns_trips_and_ticket_types(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'slug' => 'lake-tours',
        ]);

        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addDays(3),
        ]);
        $trip->product->forceFill(['capacity' => 20, 'name' => 'Lake run'])->save();

        $type = TicketType::factory()->forProgram($program)->create([
            'title' => 'Adult',
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $r = $this->getJson('/api/public/programs/lake-tours/booking-options');
        $r->assertOk();
        $r->assertJsonPath('data.trips.0.id', $trip->getKey());
        $r->assertJsonPath('data.trips.0.capacity', 20);
        $r->assertJsonPath('data.trips.0.remaining_capacity', 20);
        $r->assertJsonPath('data.trips.0.product_name', 'Lake run');
        $r->assertJsonPath('data.trips.0.product_banner_url', null);
        $r->assertJsonPath('data.trips.0.boat_type_id', null);
        $r->assertJsonPath('data.trips.0.boat_type_banner_url', null);
        $r->assertJsonPath('data.trips.0.water_route_id', null);
        $r->assertJsonPath('data.trips.0.water_route_trace_geojson', null);
        $r->assertJsonPath('data.ticket_types.0.id', $type->getKey());
        $r->assertJsonPath('data.ticket_types.0.title', 'Adult');
        $r->assertJsonPath('data.ticket_types.0.depends_on_ticket_type_id', null);
        $r->assertJsonPath('data.ticket_types.0.max_per_reference_ticket', null);
    }

    public function test_booking_options_includes_product_banner_url_when_set(): void
    {
        config(['media.public_base_url' => 'https://cdn.example']);

        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'slug' => 'banner-prog',
        ]);

        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addDays(2),
        ]);

        $key = 'uploads/'.Str::ulid().'.png';
        $trip->product->forceFill([
            'name' => 'Photo tour',
            'banner_object_key' => $key,
            'banner_mime_type' => 'image/png',
            'banner_size_bytes' => 10,
            'banner_uploaded_at' => now(),
        ])->save();

        $this->getJson('/api/public/programs/banner-prog/booking-options')
            ->assertOk()
            ->assertJsonPath('data.trips.0.product_banner_url', 'https://cdn.example/'.$key);
    }

    public function test_booking_options_includes_boat_type_banner_and_route_trace_geojson_when_set(): void
    {
        config(['media.public_base_url' => 'https://cdn.example']);

        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'slug' => 'trace-prog',
        ]);

        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addDays(2),
        ]);

        $boatType = BoatType::factory()->create([
            'program_id' => $program->getKey(),
            'name' => 'Open deck',
            'banner_object_key' => 'uploads/boat-banner.png',
        ]);
        $waterRoute = WaterRoute::factory()->create([
            'program_id' => $program->getKey(),
            'name' => 'River Loop',
        ]);

        $trip->product->forceFill([
            'boat_type_id' => $boatType->getKey(),
            'water_route_id' => $waterRoute->getKey(),
        ])->save();

        $response = $this->getJson('/api/public/programs/trace-prog/booking-options')
            ->assertOk()
            ->assertJsonPath('data.trips.0.boat_type_id', $boatType->getKey())
            ->assertJsonPath('data.trips.0.boat_type_name', 'Open deck')
            ->assertJsonPath('data.trips.0.boat_type_banner_url', 'https://cdn.example/uploads/boat-banner.png')
            ->assertJsonPath('data.trips.0.water_route_id', $waterRoute->getKey())
            ->assertJsonPath('data.trips.0.water_route_name', 'River Loop');

        $traceGeoJsonRaw = $response->json('data.trips.0.water_route_trace_geojson');
        $this->assertIsString($traceGeoJsonRaw);
        $traceGeoJson = json_decode($traceGeoJsonRaw, true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('LineString', $traceGeoJson['type'] ?? null);
        $this->assertIsArray($traceGeoJson['coordinates'] ?? null);
        $this->assertNotEmpty($traceGeoJson['coordinates'] ?? []);
    }

    public function test_booking_options_excludes_past_trips(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'past-only',
        ]);

        Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->subDay(),
        ]);

        $this->getJson('/api/public/programs/past-only/booking-options')
            ->assertOk()
            ->assertJsonCount(0, 'data.trips');
    }

    public function test_booking_options_returns_404_for_inactive_program(): void
    {
        $u = User::factory()->create();
        Program::factory()->withOwner($u)->create([
            'is_active' => false,
            'slug' => 'inactive-prog',
        ]);

        $this->getJson('/api/public/programs/inactive-prog/booking-options')
            ->assertNotFound();
    }

    public function test_booking_options_returns_404_for_past_end_date_program(): void
    {
        $u = User::factory()->create();
        Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'slug' => 'past-season',
            'start_date' => now()->subMonths(6)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
        ]);

        $this->getJson('/api/public/programs/past-season/booking-options')
            ->assertNotFound();
    }

    public function test_store_returns_404_for_inactive_program(): void
    {
        $u = User::factory()->create();
        Program::factory()->withOwner($u)->create([
            'is_active' => false,
            'slug' => 'inactive-store',
        ]);

        $this->postJson('/api/public/programs/inactive-store/bookings', [
            'trip_id' => (string) Str::ulid(),
            'ticket_quantities' => [],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertNotFound();
    }

    public function test_store_returns_404_for_past_end_date_program(): void
    {
        $u = User::factory()->create();
        Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'slug' => 'past-store',
            'start_date' => now()->subMonths(6)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
        ]);

        $this->postJson('/api/public/programs/past-store/bookings', [
            'trip_id' => (string) Str::ulid(),
            'ticket_quantities' => [],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertNotFound();
    }

    public function test_store_creates_booking_and_booking_tickets(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'book-me',
        ]);

        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();

        $type = TicketType::factory()->forProgram($program)->create([
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $payload = [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [
                (string) $type->getKey() => 2,
            ],
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
            'country' => 'CA',
        ];

        $r = $this->postJson('/api/public/programs/book-me/bookings', $payload);
        $r->assertCreated();
        $r->assertJsonPath('data.total_tickets', 2);
        $r->assertJsonPath('data.contact_email', 'alex@example.com');

        $bookingId = $r->json('data.id');
        $this->assertNotEmpty($bookingId);
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'trip_id' => $trip->getKey(),
            'contact_email' => 'alex@example.com',
        ]);
        $this->assertSame(2, BookingTicket::query()->where('booking_id', $bookingId)->count());
        $this->assertSame(
            2,
            BookingTicket::query()->where('booking_id', $bookingId)->where('country', 'CA')->count(),
        );
    }

    public function test_store_sends_booking_confirmation_notification(): void
    {
        Notification::fake();

        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'notify-me',
            'name' => 'Harbor Tours',
        ]);

        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10, 'name' => 'Sunset run'])->save();

        $type = TicketType::factory()->forProgram($program)->create([
            'title' => 'Adult',
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $this->postJson('/api/public/programs/notify-me/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 2],
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
            'country' => 'CA',
        ])->assertCreated();

        Notification::assertSentOnDemand(
            BookingConfirmationNotification::class,
            function (BookingConfirmationNotification $notification, array $channels, object $notifiable): bool {
                return ($notifiable->routes['mail'] ?? null) === 'alex@example.com'
                    && $notification->booking->contact_email === 'alex@example.com';
            },
        );

        Notification::assertCount(1);
    }

    public function test_booking_confirmation_notification_mail_renders_with_ticket_summary(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['name' => 'Harbor Tours']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['name' => 'Sunset run'])->save();
        $type = TicketType::factory()->forProgram($program)->create(['title' => 'Adult']);

        $booking = Booking::query()->create([
            'program_id' => $program->getKey(),
            'trip_id' => $trip->getKey(),
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
        ]);

        BookingTicket::query()->create([
            'booking_id' => $booking->getKey(),
            'ticket_type_id' => $type->getKey(),
            'name' => 'Alex River',
            'email' => 'alex@example.com',
            'country' => '',
            'custom_fields' => [],
        ]);

        $mail = (new BookingConfirmationNotification($booking))->toMail(
            Notification::route('mail', 'alex@example.com'),
        );

        $this->assertStringContainsString('Harbor Tours', (string) $mail->subject);
        $this->assertTrue(
            collect($mail->introLines)->contains(
                static fn (string $line): bool => str_contains($line, '2 × Adult') || str_contains($line, 'Adult'),
            ),
        );

        $this->assertCount(1, $mail->rawAttachments);
        $attachment = $mail->rawAttachments[0];
        $this->assertSame('reservation.ics', $attachment['name']);
        $this->assertSame('text/calendar', $attachment['options']['mime']);
        $ics = $attachment['data'];
        $this->assertStringContainsString('BEGIN:VCALENDAR', $ics);
        $this->assertStringContainsString('BEGIN:VEVENT', $ics);
        $this->assertStringContainsString((string) $booking->getKey(), $ics);
        $this->assertStringContainsString('Harbor Tours', $ics);
    }

    public function test_booking_confirmation_notification_mail_renders_in_english_when_locale_en(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['name' => 'Harbor Tours']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $booking = Booking::query()->create([
            'program_id' => $program->getKey(),
            'trip_id' => $trip->getKey(),
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
        ]);

        $mail = (new BookingConfirmationNotification($booking, mailLocale: 'en'))->toMail(
            Notification::route('mail', 'alex@example.com'),
        );

        $this->assertStringContainsString('Booking confirmation', (string) $mail->subject);
        $this->assertStringContainsString('Hello Alex River', (string) $mail->greeting);
    }

    public function test_booking_confirmation_notification_mail_renders_in_french_when_locale_fr(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['name' => 'Croisières']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $booking = Booking::query()->create([
            'program_id' => $program->getKey(),
            'trip_id' => $trip->getKey(),
            'contact_name' => 'Alex River',
            'contact_email' => 'alex@example.com',
        ]);

        $mail = (new BookingConfirmationNotification($booking, mailLocale: 'fr'))->toMail(
            Notification::route('mail', 'alex@example.com'),
        );

        $this->assertStringContainsString('Confirmation de réservation', (string) $mail->subject);
        $this->assertStringContainsString('Bonjour Alex River', (string) $mail->greeting);
    }

    public function test_store_does_not_send_notification_when_validation_fails(): void
    {
        Notification::fake();

        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'notify-fail']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();
        $type = TicketType::factory()->forProgram($program)->create();

        $this->postJson('/api/public/programs/notify-fail/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 0],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertUnprocessable();

        Notification::assertNothingSent();
    }

    public function test_store_rejects_trip_from_other_program(): void
    {
        $u = User::factory()->create();
        $programA = Program::factory()->withOwner($u)->create(['slug' => 'prog-a']);
        $programB = Program::factory()->withOwner($u)->create(['slug' => 'prog-b']);

        $tripB = Trip::factory()->forProgram($programB)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $tripB->product->forceFill(['capacity' => 10])->save();

        $typeA = TicketType::factory()->forProgram($programA)->create();

        $this->postJson('/api/public/programs/prog-a/bookings', [
            'trip_id' => $tripB->getKey(),
            'ticket_quantities' => [(string) $typeA->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertUnprocessable()->assertJsonValidationErrors(['trip_id']);
    }

    public function test_store_rejects_when_no_tickets_selected(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'zero']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();
        $type = TicketType::factory()->forProgram($program)->create();

        $this->postJson('/api/public/programs/zero/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 0],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertUnprocessable()->assertJsonValidationErrors(['ticket_quantities']);
    }

    public function test_store_rejects_when_over_trip_capacity(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'full']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 2])->save();
        $type = TicketType::factory()->forProgram($program)->create([
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $existing = Booking::factory()->forTrip($trip)->create();
        BookingTicket::factory()->create([
            'booking_id' => $existing->getKey(),
            'ticket_type_id' => $type->getKey(),
        ]);
        BookingTicket::factory()->create([
            'booking_id' => $existing->getKey(),
            'ticket_type_id' => $type->getKey(),
        ]);

        $this->postJson('/api/public/programs/full/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertUnprocessable()->assertJsonValidationErrors(['ticket_quantities']);
    }

    public function test_store_validates_contact_email(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'bad-mail']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();
        $type = TicketType::factory()->forProgram($program)->create();

        $this->postJson('/api/public/programs/bad-mail/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'not-an-email',
            'country' => 'CA',
        ])->assertUnprocessable()->assertJsonValidationErrors(['contact_email']);
    }

    public function test_booking_options_includes_program_booking_questions(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'is_active' => true,
            'slug' => 'questions-prog',
            'booking_questions' => [
                'First 3 characters of postal code',
            ],
        ]);

        Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addDays(2),
        ]);
        TicketType::factory()->forProgram($program)->create();

        $this->getJson('/api/public/programs/questions-prog/booking-options')
            ->assertOk()
            ->assertJsonPath('data.booking_questions.0', 'First 3 characters of postal code');
    }

    public function test_store_requires_answers_for_configured_booking_questions_and_persists_custom_fields(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create([
            'slug' => 'with-questions',
            'booking_questions' => [
                'First 3 characters of postal code',
            ],
        ]);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();
        $type = TicketType::factory()->forProgram($program)->create([
            'min_per_purchase' => 1,
            'max_per_purchase' => 10,
        ]);

        $this->postJson('/api/public/programs/with-questions/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
            'custom_answers' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors(['custom_answers']);

        $response = $this->postJson('/api/public/programs/with-questions/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
            'custom_answers' => ['H2X'],
        ])->assertCreated();

        $bookingId = (string) $response->json('data.id');
        /** @var BookingTicket $ticket */
        $ticket = BookingTicket::query()->where('booking_id', $bookingId)->firstOrFail();
        $this->assertSame(
            ['First 3 characters of postal code' => 'H2X'],
            $ticket->custom_fields,
        );
    }

    public function test_store_rejects_dependent_tickets_without_reference_tickets(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'dep-no-ref']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();

        $adult = TicketType::factory()->forProgram($program)->create([
            'title' => 'Adult',
            'min_per_purchase' => 0,
        ]);
        $child = TicketType::factory()->forProgram($program)->create([
            'title' => 'Child',
            'min_per_purchase' => 0,
            'depends_on_ticket_type_id' => $adult->getKey(),
            'max_per_reference_ticket' => 2,
        ]);

        $this->postJson('/api/public/programs/dep-no-ref/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [
                (string) $adult->getKey() => 0,
                (string) $child->getKey() => 1,
            ],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertUnprocessable()->assertJsonValidationErrors(["ticket_quantities.{$child->getKey()}"]);
    }

    public function test_store_rejects_dependent_tickets_exceeding_max_per_reference(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'dep-over-max']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();

        $adult = TicketType::factory()->forProgram($program)->create([
            'title' => 'Adult',
            'min_per_purchase' => 0,
        ]);
        $child = TicketType::factory()->forProgram($program)->create([
            'title' => 'Child',
            'min_per_purchase' => 0,
            'depends_on_ticket_type_id' => $adult->getKey(),
            'max_per_reference_ticket' => 2,
        ]);

        $this->postJson('/api/public/programs/dep-over-max/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [
                (string) $adult->getKey() => 1,
                (string) $child->getKey() => 3,
            ],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertUnprocessable()->assertJsonValidationErrors(["ticket_quantities.{$child->getKey()}"]);
    }

    public function test_store_accepts_dependent_tickets_within_max_per_reference(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'dep-valid']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();

        $adult = TicketType::factory()->forProgram($program)->create([
            'title' => 'Adult',
            'min_per_purchase' => 0,
            'max_per_purchase' => 10,
        ]);
        $child = TicketType::factory()->forProgram($program)->create([
            'title' => 'Child',
            'min_per_purchase' => 0,
            'max_per_purchase' => 10,
            'depends_on_ticket_type_id' => $adult->getKey(),
            'max_per_reference_ticket' => 2,
        ]);

        $this->postJson('/api/public/programs/dep-valid/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [
                (string) $adult->getKey() => 2,
                (string) $child->getKey() => 4,
            ],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CA',
        ])->assertCreated()->assertJsonPath('data.total_tickets', 6);
    }

    public function test_store_validates_country(): void
    {
        $u = User::factory()->create();
        $program = Program::factory()->withOwner($u)->create(['slug' => 'bad-country']);
        $trip = Trip::factory()->forProgram($program)->create([
            'scheduled_departure_at' => now()->addWeek(),
        ]);
        $trip->product->forceFill(['capacity' => 10])->save();
        $type = TicketType::factory()->forProgram($program)->create();

        $this->postJson('/api/public/programs/bad-country/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors(['country']);

        $this->postJson('/api/public/programs/bad-country/bookings', [
            'trip_id' => $trip->getKey(),
            'ticket_quantities' => [(string) $type->getKey() => 1],
            'contact_name' => 'A',
            'contact_email' => 'a@example.com',
            'country' => 'CAN',
        ])->assertUnprocessable()->assertJsonValidationErrors(['country']);
    }
}
