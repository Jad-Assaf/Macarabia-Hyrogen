import { sendFacebookEvent } from "./facebookConversions.server";

export async function action({ request }) {
  try {
    const eventData = await request.json();
    const result = await sendFacebookEvent(eventData.eventName, eventData);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
