export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const email = body.email ? body.email.trim().toLowerCase() : null;

        // Basic Email Format Validation
        if (!email || !email.includes('@') || !email.includes('.')) {
            return new Response(JSON.stringify({ message: "Invalid email address." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const timestamp = new Date().toISOString();
        
        // Save subscriber to Cloudflare KV Namespace (Binding name: SUBSCRIBERS)
        if (env.SUBSCRIBERS) {
            await env.SUBSCRIBERS.put(`sub_${email}`, JSON.stringify({ email, timestamp }));
        } else {
            console.log(`New subscriber: ${email} at ${timestamp}`);
        }

        return new Response(JSON.stringify({ message: "Success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: "Server error. Please try again later." }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
