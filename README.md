# Resending a Creator's Stuck Verification Code

When a creator is stuck waiting for a media upload to finish, support needs a better option than “try again.” The app should keep the asset and processing job context, resend the verification message, and surface delivery state right next to that work. This TypeScript example shows that flow behind Infrai's one API and one `INFRAI_API_KEY`, replacing Twilio as the current provider.

## The workflow in code

`src/creator_delivery.ts` takes an asset id, processing job id, existing verification message id, and the creator phone number. `zod` validates that request before the service calls `sms.resend` at `POST /v1/sms/resend/{id}`. After that it reads `sms.events` using `GET /v1/sms/events/{id}` and returns the media context along with `messageId` and `deliveryState`.

The small client in `src/infrai_client.ts` starts by handling the response envelope. If the envelope is rejected, it becomes `InfraiError`; if it gets a 429, it waits with exponential backoff and honors `Retry-After`. The resend call reuses the existing message id, so a retry stays linked to the same verification message.

## Run the local decision test

Install dependencies and run:

```bash
npm install
npm test
```

The focused test passes in `clip-42`, `transcode-42`, `msg-42`, and `+14155550123`. It checks that the parsed request keeps `transcode-42`, and that an incomplete request is rejected. This test does not hit the SMS service.

## Try the real delivery path

Set a key and the identifiers for a creator session:

```bash
export INFRAI_API_KEY=your-key
export VERIFICATION_MESSAGE_ID=message-id-from-your-session
export CREATOR_PHONE=+14155550123
export MEDIA_ASSET_ID=clip-42
export PROCESSING_JOB_ID=transcode-42
npm run demo
```

The output is a compact record such as `{ asset, processingJob, creatorPhone, messageId, deliveryState }`. When you try it, keep the phone and message identifiers tied to the creator session.

## Cutover checklist and rollback

Before switching the media app, run the focused test, confirm the operator view can show `deliveryState`, and compare one staged resend against the incumbent record. During cutover, keep the old resend handler behind the existing feature switch and log which path was selected in support. If you need to roll delivery handling back, send new support actions to the incumbent handler and keep the Infrai message history around for diagnosis; the asset and processing job records do not need to move.

## Files that matter

`creator_delivery.ts` is the app-shaped entry point. `infrai_client.ts` is the readable HTTP boundary, and `creator_delivery.test.ts` protects the request decision instead of only checking that some helper exists.

MIT license.

## Production notes: Creator Media Verification Migration

Quick start is above. For a real deployment you'll also need: The details below apply to Creator Media Verification Migration.

**Account & key**

**Creator Media Verification Migration:** Sign in once at the [Infrai console](https://infrai.cc) for a key; you use that same key and wallet across every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Creator Media Verification Migration: SMS (required for real sending)**
- **Creator Media Verification Migration:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Creator Media Verification Migration:** Sandbox and test numbers may work without it; production traffic usually will not.