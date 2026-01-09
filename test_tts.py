
import asyncio
import edge_tts
import logging

logging.basicConfig(level=logging.DEBUG)

async def test_tts():
    text = "Hello, testing different voice."
    # Try different voices
    voices = ["en-US-AriaNeural", "en-US-ChristopherNeural", "en-GB-SoniaNeural"]
    
    for voice in voices:
        print(f"\nTrying voice: {voice}")
        try:
            communicate = edge_tts.Communicate(text, voice)
            filename = f"test_{voice}.mp3"
            await communicate.save(filename)
            print(f"Success! Saved to {filename}")
            return
        except Exception as e:
            print(f"Failed with {voice}: {e}")

if __name__ == "__main__":
    asyncio.run(test_tts())
