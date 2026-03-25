import { NextResponse } from "next/server";
import axios from "axios";

// This route forwards the update request to the backend using axios or fetch.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = req.headers.get("authorization");

    // We can use native fetch to call the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://closefistedly-ditriglyphic-tameika.ngrok-free.dev/api'}/user/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ error: data.message || "Failed to update" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
