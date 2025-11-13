# Backend

API server for Clean Street, built with Express + MongoDB.

## Quick start

1. `cd backend`
2. `npm install`
3. Create a `.env` file (see below)
4. `npm run dev`

## Environment variables

```
MONGODB_URI=mongodb://localhost:27017/clean_street
JWT_SECRET=changeme
ADMIN_SIGNUP_CODE=secret-admin-code
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

## Location-based filtering (Complaints)

Endpoints `GET /complaints` and `GET /complaints/recent` apply role-based location scoping.

Behavior:

* Admin: sees all complaints (no additional filters applied).
* Volunteer: sees only complaints whose `address` contains their saved `User.location` value (case-insensitive). If the volunteer has no location set, the response is empty.
* User (regular): unchanged – currently sees all complaints (can be tightened later).

To set a volunteer's location, ensure the `location` field is provided at registration or update the user profile.

## Notes

* Filtering uses a case-insensitive regex on the `address` field; ensure addresses are consistently formatted.
* Future enhancement: store structured geocoded coordinates and perform radius / polygon queries.

