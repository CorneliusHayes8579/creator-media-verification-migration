import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const deliveryRequest = z.object({
  assetId: z.string().min(1),
  processingJobId: z.string().min(1),
  verificationMessageId: z.string().min(1),
  creatorPhone: z.string().min(7)
});

export type DeliveryRequest = z.infer<typeof deliveryRequest>;

type ResendResult = { id?: string; message_id?: string };
type DeliveryState = { status?: string; state?: string; events?: unknown[] };

export async function resendCreatorCode(input: unknown, client: InfraiClient) {
  const request = deliveryRequest.parse(input);
  const resend = await client.request<ResendResult>(`/v1/sms/resend/${encodeURIComponent(request.verificationMessageId)}`, "POST", { message_id: request.verificationMessageId });
  const messageId = resend.message_id ?? resend.id ?? request.verificationMessageId;
  const delivery = await client.request<DeliveryState>(`/v1/sms/events/${encodeURIComponent(messageId)}`, "GET");
  return {
    asset: request.assetId,
    processingJob: request.processingJobId,
    creatorPhone: request.creatorPhone,
    messageId,
    deliveryState: delivery.status ?? delivery.state ?? "queued"
  };
}

async function main() {
  const key = process.env.INFRAI_API_KEY;
  const input = {
    assetId: process.env.MEDIA_ASSET_ID ?? "asset-demo-001",
    processingJobId: process.env.PROCESSING_JOB_ID ?? "job-demo-001",
    verificationMessageId: process.env.VERIFICATION_MESSAGE_ID,
    creatorPhone: process.env.CREATOR_PHONE
  };
  if (!key || !input.verificationMessageId || !input.creatorPhone) throw new Error("INFRAI_API_KEY, VERIFICATION_MESSAGE_ID, and CREATOR_PHONE are required");
  console.log(await resendCreatorCode(input, new InfraiClient(key)));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
