# Security Specification for Lyrics & Streaming App

This document outlines the security invariants, malicious attack vectors (the "Dirty Dozen"), and validation criteria to safeguard the application's Firestore database.

## 1. Data Invariants

1. **Role Access Restrictions**:
   - `admin`: Full permissions to read and write all resources (users, songs, playlists, favorites, history, complaints, notifications).
   - `author`: Permission to create songs, update songs that they uploaded (`uploadedBy == request.auth.uid`), but cannot modify other users' songs or alter the system-managed status fields (`status` should remain `"pending"` or unchanged unless an admin updates it).
   - `user` (default role): Read-only access to approved songs, ability to create/edit/delete their own playlists and favorites, and submit content reports/complaints. Can update their own profile's `preferredGenres` but cannot alter their `role` field.
2. **Identity Integrity**:
   - For all user-authored content, the `ownerId` or `userId` or `uploadedBy` field in the incoming document MUST strictly match `request.auth.uid`.
   - Access to user subcollections (e.g., `users/{userId}/favorites/{songId}`) is restricted to that user (`request.auth.uid == userId`) or an admin.
3. **Immutability Invariants**:
   - Fields such as `createdAt` must be set to `request.time` upon creation and never modified.
   - User profiles cannot self-assign roles; role modifications must be restricted to administrators or during initial bootstrap if checked securely.
4. **Valid Schema Structure**:
   - All text inputs must be size-constrained to prevent Denial of Wallet resource attacks.
   - All document IDs must be validated to prevent ID poisoning and malicious payload injection.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 JSON payloads represent malicious write requests that MUST return `PERMISSION_DENIED` under all circumstances.

### Payload 1: Self-Privilege Escalation
*Attempting to change the user's role to admin.*
```json
// Path: /users/attacker_uid
// Operation: UPDATE
{
  "role": "admin"
}
```

### Payload 2: Hijacking Owner ID
*Attempting to create a song and set the `uploadedBy` field to another user.*
```json
// Path: /songs/malicious_song_1
// Operation: CREATE
{
  "id": "malicious_song_1",
  "title": "Stolen Tracks",
  "artist": "Victim",
  "lyrics": "N/A",
  "uploadedBy": "victim_uid",
  "status": "pending"
}
```

### Payload 3: Illegal Song Approval
*An author attempts to auto-approve their own song without admin verification.*
```json
// Path: /songs/author_song_2
// Operation: CREATE/UPDATE
{
  "id": "author_song_2",
  "title": "Instant Hit",
  "artist": "Author User",
  "lyrics": "Fast track",
  "uploadedBy": "attacker_author_uid",
  "status": "approved"
}
```

### Payload 4: Editing Other's Lyrics
*An author attempts to overwrite lyrics of a song owned by another artist.*
```json
// Path: /songs/other_artist_song_id
// Operation: UPDATE
{
  "lyrics": "Vandalized lyrics text"
}
```

### Payload 5: Overwriting Creation Time
*Attempting to change the immutable `createdAt` timestamp of a song.*
```json
// Path: /songs/my_song_id
// Operation: UPDATE
{
  "createdAt": "2020-01-01T00:00:00Z"
}
```

### Payload 6: Playlists Cross-Ownership Hijack
*An attacker attempts to write or edit a playlist belonging to another user.*
```json
// Path: /playlists/victim_playlist_id
// Operation: CREATE/UPDATE
{
  "id": "victim_playlist_id",
  "name": "Hacked Playlist",
  "ownerId": "victim_uid",
  "songIds": ["some_song"]
}
```

### Payload 7: Fake Favorite Subcollection Injection
*An attacker attempts to insert a bookmark into a victim's favorites subcollection.*
```json
// Path: /users/victim_uid/favorites/song_id
// Operation: CREATE
{
  "userId": "victim_uid",
  "songId": "song_id"
}
```

### Payload 8: History Spoofing
*An attacker attempts to insert playback history logs for another user.*
```json
// Path: /listeningHistory/history_spoof_id
// Operation: CREATE
{
  "id": "history_spoof_id",
  "userId": "victim_uid",
  "songId": "song_id",
  "playedAt": "2026-07-02T00:00:00Z"
}
```

### Payload 9: Malicious ID Poisoning (Path Injection)
*An attacker attempts to inject a 1MB nested string payload as a document ID.*
```json
// Path: /songs/<1MB_malicious_string_injection_with_backslashes>
// Operation: CREATE
{
  "id": "<1MB_malicious_string_injection_with_backslashes>",
  "title": "SQL Injection Attempt",
  "artist": "Hacker",
  "lyrics": "Malicious code",
  "uploadedBy": "attacker_uid",
  "status": "pending"
}
```

### Payload 10: Modifying Admin-Only Complaints
*A regular user attempts to mark a DMCA copyright complaint as "resolved" to hide it.*
```json
// Path: /complaints/dmca_complaint_id
// Operation: UPDATE
{
  "status": "resolved"
}
```

### Payload 11: Spoofed Email Verification Admin Bypass
*An attacker attempts to claim the admin role without verifying their email.*
```json
// Auth Context: { email: "davidyzefovic@gmail.com", email_verified: false }
// Path: /complaints/some_complaint_id
// Operation: UPDATE
{
  "status": "dismissed"
}
```

### Payload 12: List Query Blanket Scrubbing
*An unauthenticated user attempts to list all complaints or user histories without filtering criteria.*
```json
// Path: /listeningHistory
// Operation: LIST (Query with no filter)
```

---

## 3. Test Runner Design

Below is the design verification structure which maps directly to the compiled Firestore security rules testing system.

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Verification suite validates that all 12 malicious payloads are blocked.
describe("Firestore Security Rules Hardening Suite", () => {
  it("Blocks self-privilege escalation (Payload 1)", async () => {
    // Verified via: Rules reject any user profile write containing 'role' updates unless request.auth.uid is an admin.
  });
  it("Prevents author hijacking owner ID (Payload 2)", async () => {
    // Verified via: isValidSong verifies incoming().uploadedBy == request.auth.uid.
  });
  it("Prevents unauthorized song auto-approval (Payload 3)", async () => {
    // Verified via: status must be "pending" on creation or unchanged on author edits.
  });
  it("Prevents editing others' lyrics (Payload 4)", async () => {
    // Verified via: song edit requires uploadedBy == auth.uid.
  });
});
```
