export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'success', 
    message: 'Socket.IO endpoint is ready',
    note: 'Socket.IO client will connect to external server',
    timestamp: Date.now()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}