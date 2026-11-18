# Voting application

The application has a React/Vite frontend and an Express/MongoDB backend.

## Run locally

1. Configure the backend environment variables in `backend/.env`, including
   `MONGODB_URL_LOCAL` and `JWT_SECERET`.
2. Start the API from `backend/` with `npm start` (port 3000 by default).
3. Start the frontend from `frontend/` with `npm run dev`. Set
   `VITE_API_BASE_URL` if the API is not at `http://localhost:3000`.

## Voting and administration

- Voters see active elections, can cast one vote per election, and can review
  their own choices and timestamps in Election history.
- Administrators manage candidates at `/admin/candidates`; election statistics,
  election creation, and registered users each have separate pages at `/admin`,
  `/admin/elections/new`, and `/admin/users`.
- Administrators can block or delete voter accounts from Registered users.
  Deleting a voter also removes their recorded ballots and legacy voting
  history, reducing the corresponding election and candidate vote totals.
  Administrator accounts cannot be deleted through this action.
- Election results become visible to voters only after an administrator stops
  the election and publishes its results.
- Voters can hide their own vote-history entries without changing ballots or
  election totals. Administrators can permanently delete a stopped election
  and its associated vote history; active elections must be stopped first.
- The admin election page shows an Active badge only while an election is
  running; a stopped election no longer has the Active badge.
- Active election progress refreshes automatically every five seconds.
- The light/dark theme preference is stored in the browser.
- Signed-in users can open the election assistant chat UI. It is currently a
  frontend-only preview; chat replies are placeholders until an AI backend is
  connected.
- The admin party-wise vertical bar chart loads election-scoped vote totals
  from the admin-only `/elections/:electionId/party-statistics` API, which
  aggregates MongoDB vote records by candidate party. Active elections refresh
  chart data every five seconds.

MongoDB transactions are used when recording a ballot so voting and eligibility
updates are committed together.

## Account access

- Public signup requires an email address and sends a six-digit verification
  code. The account becomes signed in after the code is verified.
- Password recovery uses the account's 12-digit Aadhaar number and a reset code
  sent to its verified email.
- Email-change verification is not currently supported by the backend. The
  existing profile update changes the email address directly.
