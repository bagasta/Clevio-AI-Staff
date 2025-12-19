import { NextResponse } from 'next/server';

// In-memory storage keyed by chatSessionId for multi-user isolation
// Note: In production, use Redis or database for persistence across serverless invocations
if (!global.interviewDataMap) {
  global.interviewDataMap = new Map();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { chatSessionId, agentId, agentName, systemMessage } = body;

    console.log('[API] Received Interview Finish Webhook:', { chatSessionId, agentId, agentName });

    // Validate payload
    if (!chatSessionId) {
      return NextResponse.json(
        { error: 'Missing chatSessionId in payload' },
        { status: 400 }
      );
    }
    
    if (!agentName) {
      return NextResponse.json(
        { error: 'Missing agentName in payload' },
        { status: 400 }
      );
    }

    // Store data keyed by chatSessionId
    global.interviewDataMap.set(chatSessionId, {
      agentId,
      agentName,
      systemMessage,
      timestamp: Date.now(),
    });

    console.log('[API] Stored data for session:', chatSessionId);

    return NextResponse.json({ success: true, message: 'Data received' });
  } catch (error) {
    console.error('[API] Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  // Get chatSessionId from query params
  const { searchParams } = new URL(request.url);
  const chatSessionId = searchParams.get('chatSessionId');
  
  if (!chatSessionId) {
    return NextResponse.json({ data: null, error: 'Missing chatSessionId' });
  }
  
  // Return data for this specific session
  const data = global.interviewDataMap.get(chatSessionId) || null;
  
  // Optional: Clear after consumption to prevent stale data
  // if (data) global.interviewDataMap.delete(chatSessionId);
  
  return NextResponse.json({ data });
}
