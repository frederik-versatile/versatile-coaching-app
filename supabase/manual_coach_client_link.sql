-- One-off: manually link a coach test account to a client test account.
-- There's no invite UI yet (that's a later phase), so this is the only way
-- to create a coach_clients row for Phase 1 testing.
--
-- Adjust the two emails below to match the test accounts you want linked,
-- then run this in the Supabase SQL editor.

insert into coach_clients (coach_id, client_id)
select coach.id, client.id
from profiles coach
join auth.users coach_u on coach_u.id = coach.id
cross join profiles client
join auth.users client_u on client_u.id = client.id
where coach_u.email = 'frederik+coach2@sparkforce.dk'
  and client_u.email = 'frederik+client1@sparkforce.dk'
  and coach.role = 'coach'
  and client.role = 'client'
on conflict do nothing;

-- Sanity check: should return exactly one row.
select coach_clients.*, coach_u.email as coach_email, client_u.email as client_email
from coach_clients
join auth.users coach_u on coach_u.id = coach_clients.coach_id
join auth.users client_u on client_u.id = coach_clients.client_id;
