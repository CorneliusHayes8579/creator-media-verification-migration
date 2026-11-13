import test from "node:test";
import assert from "node:assert/strict";
import { deliveryRequest } from "./creator_delivery.ts";

test("a creator delivery request keeps asset and processing context at the resend boundary", () => {
  const result = deliveryRequest.safeParse({
    assetId: "clip-42",
    processingJobId: "transcode-42",
    verificationMessageId: "msg-42",
    creatorPhone: "+14155550123"
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.processingJobId, "transcode-42");
  assert.equal(deliveryRequest.safeParse({ assetId: "clip-42" }).success, false);
});
