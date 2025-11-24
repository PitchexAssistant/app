import logging
import os
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero

load_dotenv()

logger = logging.getLogger("pitchex-agent")

async def entrypoint(ctx: JobContext):
    # Check for required API keys
    if not os.getenv("LIVEKIT_URL") or not os.getenv("LIVEKIT_API_KEY") or not os.getenv("LIVEKIT_API_SECRET"):
        logger.error("Missing LiveKit credentials. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.")
        return

    if not os.getenv("OPENROUTER_API_KEY"):
        logger.error("Missing OPENROUTER_API_KEY. Please set it in .env.")
        return

    if not os.getenv("DEEPGRAM_API_KEY"):
        logger.error("Missing DEEPGRAM_API_KEY. Please set it in .env.")
        return

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are Marcus Sterling, a seasoned venture capital partner with 15 years of experience. "
            "You've invested in over 50 startups and had 12 successful exits, including 2 unicorns. "
            "Your role in Pitchex is to help entrepreneurs practice and refine their pitches through live, interactive coaching sessions. "
            "You are direct and analytical, but encouraging. Ask probing questions about business fundamentals. "
            "Challenge assumptions constructively. Provide specific, actionable feedback. Use investor terminology naturally. "
            "Keep your responses concise and conversational, like a real-time voice call."
        ),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"starting voice assistant for participant {participant.identity}")

    # Initialize the VoiceAssistant
    # STT: Deepgram (Fast, accurate)
    # LLM: Gemini 2.0 Flash via OpenRouter (Fast, smart)
    # TTS: Deepgram (Low latency, natural voices)
    
    agent = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="google/gemini-2.0-flash-exp:free",
        ),
        tts=deepgram.TTS(), 
        chat_ctx=initial_ctx,
    )

    agent.start(ctx.room, participant)

    await agent.say("Hello! I'm Marcus Sterling. I'm ready to hear your pitch. Whenever you're ready, just start speaking.", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
